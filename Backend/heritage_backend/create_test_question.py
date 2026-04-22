import os
import sys
import django

# Add the project directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.thematic_groups.models import ThematicGroup
from apps.posts.models import Post
from django.utils import timezone

def create_test_question():
    # Find the group
    group = ThematicGroup.objects(name__icontains="Heritage Workshop").first()
    if not group:
        print("Group 'Heritage Workshop' not found. Creating it for testing...")
        group = ThematicGroup(
            name="Heritage Workshop",
            description="Testing group",
            category="Historical Sites",
            admin_id="test_admin_id"
        )
        group.save()
        print("Created group:", group.name)

    # Create the question post
    post = Post(
        author_id=group.admin_id or "test_author_123",
        title="Test Question",
        content="This is a test question to verify that the question functionality is working in the group page.",
        post_type="question",
        group_id=str(group.id),
        group_visibility="public",
        created_at=timezone.now(),
        updated_at=timezone.now()
    )
    post.save()
    print(f"Successfully created test question post '{post.title}' in group '{group.name}' with id: {post.id}")

if __name__ == "__main__":
    create_test_question()
