from rest_framework import serializers
from .models import Post, PostImage

class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ["image"]

class PostSerializer(serializers.ModelSerializer):
    images = PostImageSerializer(many=True, read_only=True)
    gems_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "username",
            "title",
            "content",
            "post_type",
            "historical_period",
            "monument_type",
            "region",
            "location",
            "latitude",
            "longitude",
            "images",
            "gems_count",
            "comments_count",
            "created_at",
        ]