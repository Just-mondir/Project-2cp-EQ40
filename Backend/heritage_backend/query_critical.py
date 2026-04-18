import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "heritage_backend.settings")
django.setup()
from apps.posts.models import AlertDetails, Post

critical_details = AlertDetails.objects(urgence_level="critical")
post_ids = [ed.post.id for ed in critical_details]
posts = Post.objects(id__in=post_ids, post_type="alert", is_deleted=False)
print("ALERTS:", critical_details.count())
print("POSTS:", posts.count())
for p in posts:
    print(p.id, p.title)

