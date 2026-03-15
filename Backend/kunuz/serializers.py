from rest_framework import serializers
from .models import Post, PostImage

class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['image']

class PostSerializer(serializers.ModelSerializer):
    images = PostImageSerializer(many=True, read_only=True)
    gems_count = serializers.IntegerField(source='gems_count', read_only=True)
    comments_count = serializers.IntegerField(source='comments_count', read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'post_type', 'historical_period',
            'monument_type', 'region', 'visibility', 'location',
            'latitude', 'longitude', 'images', 'gems_count', 'comments_count',
            'created_at'
        ]
        