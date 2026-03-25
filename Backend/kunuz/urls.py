from django.urls import path
from .views import global_search, search_users

urlpatterns = [
    path("search/", global_search, name="global_search"),
    path("search-users/", search_users, name="search_users"),
]