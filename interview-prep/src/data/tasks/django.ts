import type { TaskPath } from './types'

// Django cannot run in the browser, so these tasks are checked against what the code
// must contain: the checklist tells you exactly which pieces are missing.

export const django: TaskPath = {
  id: 'django',
  title: 'Django',
  blurb: 'Build the pieces of a Django app: models, views, URLs, queries and an API.',
  tasks: [
    {
      id: 'model',
      kind: 'rules',
      language: 'python',
      title: 'Create a model',
      goal: 'Write the `Product` model for `products/models.py`.',
      steps: [
        'Fields: `name` (CharField, max 120), `price` (DecimalField), `in_stock` (BooleanField, default True), `category` (ForeignKey to `Category`).',
        'Add `created` with `auto_now_add=True`.',
        'Add `class Meta` ordering newest first (`-created`) and a `__str__` that returns the name.',
      ],
      starter: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=80)

class Product(models.Model):
    pass
`,
      hints: ['Every model inherits from `models.Model`; fields are class attributes.', 'A ForeignKey needs `on_delete=models.CASCADE`.', '`ordering = ["-created"]` goes inside `class Meta:`.'],
      solution: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=80)

class Product(models.Model):
    name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    in_stock = models.BooleanField(default=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return self.name
`,
      rules: [
        { label: '\`name\` is a \`CharField\` with \`max_length\`', match: /name\s*=\s*models\.CharField\([^)]*max_length=\d+/, min: 2, hint: 'Product needs name = models.CharField(max_length=120).' },
        { label: '`price` is a `DecimalField`', match: /price\s*=\s*models\.DecimalField\(/, hint: 'price = models.DecimalField(max_digits=8, decimal_places=2)' },
        { label: '`in_stock` is a `BooleanField` defaulting to True', match: /in_stock\s*=\s*models\.BooleanField\([^)]*default=True/, hint: 'in_stock = models.BooleanField(default=True)' },
        { label: '`category` is a `ForeignKey` with `on_delete`', match: /category\s*=\s*models\.ForeignKey\(\s*Category[^)]*on_delete=models\.CASCADE/, hint: 'models.ForeignKey(Category, on_delete=models.CASCADE)' },
        { label: '`created` uses `auto_now_add=True`', match: /created\s*=\s*models\.DateTimeField\([^)]*auto_now_add=True/, hint: 'created = models.DateTimeField(auto_now_add=True)' },
        { label: 'Orders newest first in `class Meta`', match: /class\s+Meta:[\s\S]*ordering\s*=\s*\[\s*["']-created["']\s*\]/, hint: 'class Meta: ordering = ["-created"]' },
        { label: 'Has a `__str__` method', match: /def\s+__str__\(self\)/, hint: 'def __str__(self): return self.name' },
      ],
      learned: 'A Django model is a Python class that becomes a database table; after editing it you run `makemigrations` and `migrate`.',
    },
    {
      id: 'view-url',
      kind: 'rules',
      language: 'python',
      title: 'Connect a URL, a view and a template',
      goal: 'Show a product list at `/products/` and one product at `/products/<id>/`.',
      steps: [
        'In `views.py` write `product_list(request)` that renders `products/list.html` with all products.',
        'Write `product_detail(request, pk)` using `get_object_or_404`.',
        'In `urls.py` add two `path()` entries with names `product-list` and `product-detail`.',
      ],
      starter: `# products/views.py
from django.shortcuts import render
from .models import Product

# products/urls.py
from django.urls import path
urlpatterns = []
`,
      hints: ['`render(request, "template.html", {"products": products})` returns the page.', '`get_object_or_404(Product, pk=pk)` shows a 404 page instead of crashing.', '`path("<int:pk>/", views.product_detail, name="product-detail")`'],
      solution: `# products/views.py
from django.shortcuts import get_object_or_404, render
from .models import Product

def product_list(request):
    products = Product.objects.all()
    return render(request, "products/list.html", {"products": products})

def product_detail(request, pk):
    product = get_object_or_404(Product, pk=pk)
    return render(request, "products/detail.html", {"product": product})

# products/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("", views.product_list, name="product-list"),
    path("<int:pk>/", views.product_detail, name="product-detail"),
]
`,
      rules: [
        { label: 'Imports `get_object_or_404` and `render`', match: /from\s+django\.shortcuts\s+import\s+[^\n]*get_object_or_404[^\n]*|from\s+django\.shortcuts\s+import\s+[^\n]*render[^\n]*get_object_or_404/, hint: 'from django.shortcuts import get_object_or_404, render' },
        { label: '`product_list` renders `products/list.html`', match: /def\s+product_list\(request\)[\s\S]*render\(\s*request\s*,\s*["']products\/list\.html["']/, hint: 'Use render(request, "products/list.html", {...}).' },
        { label: '`product_detail` uses `get_object_or_404`', match: /def\s+product_detail\(request,\s*pk\)[\s\S]*get_object_or_404\(\s*Product\s*,\s*pk=pk\s*\)/, hint: 'product = get_object_or_404(Product, pk=pk)' },
        { label: 'Has a `path` named `product-list`', match: /path\(\s*["']{2}\s*,\s*views\.product_list\s*,\s*name=["']product-list["']/, hint: 'path("", views.product_list, name="product-list")' },
        { label: 'Has a `path` with `<int:pk>` named `product-detail`', match: /path\(\s*["']<int:pk>\/["']\s*,\s*views\.product_detail\s*,\s*name=["']product-detail["']/, hint: 'path("<int:pk>/", views.product_detail, name="product-detail")' },
      ],
      learned: 'The URL router picks a view, the view fetches data and renders a template: that is Django\'s request flow in three small files.',
    },
    {
      id: 'queryset',
      kind: 'rules',
      language: 'python',
      title: 'Query with the ORM (and avoid N+1)',
      goal: 'Write `cheap_in_stock()` that returns in-stock products under 500, cheapest first, loading each category in the same query.',
      steps: [
        'Filter with `in_stock=True` and `price__lt=500`.',
        'Sort with `.order_by("price")`.',
        'Add `.select_related("category")` so reading `product.category` does not hit the database again.',
      ],
      starter: `from .models import Product

def cheap_in_stock():
    return Product.objects.all()
`,
      hints: ['Field lookups use double underscores: `price__lt=500` means price < 500.', 'QuerySet methods chain: `.filter(...).order_by(...)`.', '`select_related` follows a ForeignKey with a SQL JOIN.'],
      solution: `from .models import Product

def cheap_in_stock():
    return (
        Product.objects.filter(in_stock=True, price__lt=500)
        .select_related("category")
        .order_by("price")
    )
`,
      rules: [
        { label: 'Filters `in_stock=True`', match: /filter\([^)]*in_stock=True/, hint: 'Product.objects.filter(in_stock=True, …)' },
        { label: 'Filters `price__lt=500`', match: /price__lt=500/, hint: 'Add price__lt=500 to the filter.' },
        { label: 'Orders by `price`', match: /\.order_by\(\s*["']price["']\s*\)/, hint: '.order_by("price")' },
        { label: 'Uses `select_related("category")`', match: /\.select_related\(\s*["']category["']\s*\)/, hint: 'Add .select_related("category") to avoid N+1 queries.' },
        { label: 'No longer returns `.all()`', match: /objects\.all\(\)/, absent: true, hint: 'Replace .all() with your filter.' },
      ],
      learned: 'The ORM turns method chains into SQL, and `select_related` / `prefetch_related` remove the N+1 problem of one extra query per row.',
    },
    {
      id: 'drf-api',
      kind: 'rules',
      language: 'python',
      title: 'Expose an API with Django REST framework',
      goal: 'Create a serializer and a ViewSet so `/products/` is a full REST API.',
      steps: [
        'Write `ProductSerializer(serializers.ModelSerializer)` with `Meta`: `model = Product` and `fields`.',
        'Add `validate_price(self, value)` that raises `serializers.ValidationError` when the price is 0 or less.',
        'Write `ProductViewSet(viewsets.ModelViewSet)` and register it on a `DefaultRouter`.',
      ],
      starter: `from rest_framework import serializers, viewsets
from rest_framework.routers import DefaultRouter
from .models import Product
`,
      hints: ['`class Meta: model = Product; fields = ["id", "name", "price"]`', 'A `validate_<field>` method is called automatically for that field.', '`router.register("products", ProductViewSet)` then `urlpatterns = router.urls`.'],
      solution: `from rest_framework import serializers, viewsets
from rest_framework.routers import DefaultRouter
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price", "category"]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be positive")
        return value

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

router = DefaultRouter()
router.register("products", ProductViewSet)
urlpatterns = router.urls
`,
      rules: [
        { label: 'Serializer extends `serializers.ModelSerializer`', match: /class\s+ProductSerializer\(\s*serializers\.ModelSerializer\s*\)/, hint: 'class ProductSerializer(serializers.ModelSerializer):' },
        { label: '`Meta` sets `model` and `fields`', match: /class\s+Meta:[\s\S]*model\s*=\s*Product[\s\S]*fields\s*=\s*\[/, hint: 'class Meta: model = Product; fields = [...]' },
        { label: 'Validates the price', match: /def\s+validate_price\(self,\s*value\)[\s\S]*raise\s+serializers\.ValidationError/, hint: 'Raise serializers.ValidationError for prices <= 0.' },
        { label: 'ViewSet extends `ModelViewSet` with `queryset` and `serializer_class`', match: /class\s+ProductViewSet\(\s*viewsets\.ModelViewSet\s*\)[\s\S]*queryset\s*=[\s\S]*serializer_class\s*=\s*ProductSerializer/, hint: 'Set queryset and serializer_class on the ViewSet.' },
        { label: 'Registers the ViewSet on a `DefaultRouter`', match: /router\s*=\s*DefaultRouter\(\)[\s\S]*router\.register\(\s*["']products["']\s*,\s*ProductViewSet/, hint: 'router.register("products", ProductViewSet)' },
      ],
      learned: 'A serializer validates and converts data, a ViewSet provides the CRUD actions, and a router wires the URLs: a full API in a few lines.',
    },
    {
      id: 'protected-view',
      kind: 'rules',
      language: 'python',
      title: 'Protect a view and handle a form',
      goal: 'Write `add_review(request, pk)` that only logged-in users can use and that handles a POST safely.',
      steps: [
        'Decorate the view with `@login_required`.',
        'Load the product with `get_object_or_404`.',
        'On `request.method == "POST"` create a `Review` for `request.user`, then `redirect("product-detail", pk=pk)`.',
      ],
      starter: `from django.shortcuts import get_object_or_404, redirect, render
from .models import Product, Review

def add_review(request, pk):
    pass
`,
      hints: ['`from django.contrib.auth.decorators import login_required`, then put `@login_required` above the function.', 'The form fields are in `request.POST["text"]`.', 'After a successful POST, always redirect so a refresh does not resubmit the form.'],
      solution: `from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from .models import Product, Review

@login_required
def add_review(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == "POST":
        Review.objects.create(product=product, author=request.user, text=request.POST["text"])
        return redirect("product-detail", pk=pk)
    return render(request, "products/review_form.html", {"product": product})
`,
      rules: [
        { label: 'Imports `login_required`', match: /from\s+django\.contrib\.auth\.decorators\s+import\s+login_required/, hint: 'from django.contrib.auth.decorators import login_required' },
        { label: 'The view has `@login_required`', match: /@login_required\s*\n\s*def\s+add_review/, hint: 'Put @login_required right above def add_review.' },
        { label: 'Loads the product with `get_object_or_404`', match: /get_object_or_404\(\s*Product\s*,\s*pk=pk\s*\)/, hint: 'product = get_object_or_404(Product, pk=pk)' },
        { label: 'Handles `request.method == "POST"`', match: /request\.method\s*==\s*["']POST["']/, hint: 'if request.method == "POST":' },
        { label: 'Saves the review for `request.user`', match: /Review\.objects\.create\([^)]*request\.user/, hint: 'Review.objects.create(..., author=request.user, ...)' },
        { label: 'Redirects after a successful POST', match: /return\s+redirect\(\s*["']product-detail["']\s*,\s*pk=pk\s*\)/, hint: 'return redirect("product-detail", pk=pk)' },
      ],
      learned: '`@login_required` guards a view in one line, and the post-redirect-get pattern stops users from submitting a form twice.',
    },
  ],
}
