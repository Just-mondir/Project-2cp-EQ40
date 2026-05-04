from datetime import datetime, timedelta

from django.core.management import CommandError
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.posts.models import Post
from apps.thematic_groups.models import ThematicGroup
from apps.users.models import User
from apps.moderator.models import PlatformSnapshot, Visitor


class Command(BaseCommand):
    help = "Create or update a daily platform snapshot."

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            help="Date for snapshot in YYYY-MM-DD format. Defaults to today.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite existing snapshot if it exists.",
        )

    def handle(self, *args, **options):
        date_str = options.get("date")
        force = options.get("force", False)

        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                raise CommandError("Date must be in YYYY-MM-DD format.")
            target_date = timezone.make_aware(target_date, timezone.get_current_timezone())
        else:
            target_date = timezone.now()

        target_date = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        snapshot = PlatformSnapshot.objects(date=target_date).first()
        if snapshot and not force:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Snapshot for {target_date.date()} already exists. Use --force to overwrite.",
                ),
            )
            return

        members = User.objects(created_at__lte=end_of_day).count()
        groups = ThematicGroup.objects(created_at__lte=end_of_day).count()
        visitors = Visitor.objects(date__lte=end_of_day).count()
        posts = Post.objects(created_at__lte=end_of_day, is_deleted=False).count()

        if snapshot:
            snapshot.members = members
            snapshot.groups = groups
            snapshot.visitors = visitors
            snapshot.posts = posts
            snapshot.save()
            self.stdout.write(self.style.SUCCESS(f"Updated snapshot for {target_date.date()}"))
            return

        PlatformSnapshot(
            date=target_date,
            members=members,
            groups=groups,
            visitors=visitors,
            posts=posts,
        ).save()
        self.stdout.write(self.style.SUCCESS(f"Created snapshot for {target_date.date()}"))
