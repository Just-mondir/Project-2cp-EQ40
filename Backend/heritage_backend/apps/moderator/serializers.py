from __future__ import annotations

from rest_framework import serializers



class ModeratorUserSerializer(serializers.Serializer):
    id = serializers.CharField()
    display_name = serializers.CharField()
    username = serializers.CharField()
    expertise = serializers.CharField()
    profile_picture = serializers.CharField()
    role = serializers.CharField()
    created_at = serializers.DateTimeField()
    post_count = serializers.IntegerField()
