from rest_framework import serializers
from .models import Post, PostImage, Annotation


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ["image"]


class PostSerializer(serializers.ModelSerializer):
    images = PostImageSerializer(many=True, read_only=True)
    gems_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "user",
            "username",
            "title",
            "content",
            "post_type",
            "historical_period",
            "monument_type",
            "region",
            "visibility",
            "location",
            "latitude",
            "longitude",
            "images",
            "gems_count",
            "comments_count",
            "created_at",
            "updated_at",
            "is_deleted",
        ]


class AnnotationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Annotation
        fields = [
            "id",
            "post",
            "user",
            "username",
            "text",
            "image",
            "status",
            "created_at",
            "updated_at",
            "validated_by",
            "validated_at",
        ]
        read_only_fields = [
            "user",
            "status",
            "created_at",
            "updated_at",
            "validated_by",
            "validated_at",
        ]

    def validate(self, attrs):
        text = attrs.get("text")
        image = attrs.get("image")

        if not text and not image:
            raise serializers.ValidationError("Annotation must contain text or image.")

        return attrs