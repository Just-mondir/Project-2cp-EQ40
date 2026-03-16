from django.urls import path
from .views import global_search, search_test_page

urlpatterns = [
    path("search/", global_search, name="global_search"),
    path("search-test/", search_test_page, name="search_test"),
]