from datetime import datetime, timedelta

from django.core.management import CommandError
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.posts.models import Post
from apps.thematic_groups.models import ThematicGroup
from apps.users.models import User
from apps.moderator.models import PlatformSnapshot, Visitor


class Command(BaseCommand):
    help = "Backfill platform snapshot history from available records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--start-date",
            type=str,
            help="Start date in YYYY-MM-DD format. Defaults to the earliest available record.",
        )
        parser.add_argument(
            "--end-date",
            type=str,
            help="End date in YYYY-MM-DD format. Defaults to today.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite existing snapshots.",
        )

    def handle(self, *args, **options):
        start_date = options.get("start_date")
        end_date = options.get("end_date")
        force = options.get("force", False)

        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                raise CommandError("Start date must be in YYYY-MM-DD format.")
            start_date_obj = timezone.make_aware(start_date_obj, timezone.get_current_timezone())
        else:
            start_date_obj = self._find_earliest_record_date()
            if not start_date_obj:
                raise CommandError("No records found to determine a start date.")

        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
            except ValueError:
                raise CommandError("End date must be in YYYY-MM-DD format.")
            end_date_obj = timezone.make_aware(end_date_obj, timezone.get_current_timezone())
        else:
            end_date_obj = timezone.now()

        start_date_obj = start_date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date_obj = end_date_obj.replace(hour=0, minute=0, second=0, microsecond=0)

        if end_date_obj < start_date_obj:
            raise CommandError("End date must be the same as or later than the start date.")

        current_date = start_date_obj
        while current_date <= end_date_obj:
            self.stdout.write(f"Processing snapshot for {current_date.date()}...")
            self._create_snapshot_for_date(current_date, force)
            current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS("Backfill completed."))

    def _find_earliest_record_date(self):
        candidate_dates = []

        first_user = User.objects.order_by("created_at").first()
        if first_user and getattr(first_user, "created_at", None):
            candidate_dates.append(first_user.created_at)

        first_group = ThematicGroup.objects.order_by("created_at").first()
        if first_group and getattr(first_group, "created_at", None):
            candidate_dates.append(first_group.created_at)

        first_post = Post.objects.order_by("created_at").first()
        if first_post and getattr(first_post, "created_at", None):
            candidate_dates.append(first_post.created_at)

        first_visitor = Visitor.objects.order_by("date").first()
        if first_visitor and getattr(first_visitor, "date", None):
            candidate_dates.append(first_visitor.date)

        return min(candidate_dates) if candidate_dates else None

    def _create_snapshot_for_date(self, target_date, force: bool):
        end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        snapshot = PlatformSnapshot.objects(date=target_date).first()

        if snapshot and not force:
            self.stdout.write(self.style.SUCCESS(f"Skipping existing snapshot for {target_date.date()}"))
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
            return

        PlatformSnapshot(
            date=target_date,
            members=members,
            groups=groups,
            visitors=visitors,
            posts=posts,
        ).save()
