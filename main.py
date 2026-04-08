from flask import Flask, render_template, request, jsonify, abort, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import psycopg2
import urllib.parse
import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Load environment variables from .env (if present)
load_dotenv(os.path.join(BASE_DIR, '.env'))

app = Flask(__name__)

# Read Postgres connection from environment variables (loaded from .env)
DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASS = os.environ.get('DB_PASS')
DB_NAME = os.environ.get('DB_NAME')
DB_PORT = os.environ.get('DB_PORT')

# Validate required env vars
missing = [k for k in ('DB_HOST','DB_USER','DB_PASS','DB_NAME','DB_PORT') if not os.environ.get(k)]
if missing:
    msg = f"Missing required environment variables: {', '.join(missing)}. Please set them in .env or environment."
    print(msg)
    raise SystemExit(1)

# Convert port to int
DB_PORT = int(DB_PORT)

# Try to create the database if it doesn't exist (best-effort). Use psycopg2
try:
    tmp_conn = psycopg2.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, port=DB_PORT, dbname='postgres')
    tmp_conn.autocommit = True
    with tmp_conn.cursor() as cur:
        # Use safe identifier quoting
        cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (DB_NAME,))
        exists = cur.fetchone()
        if not exists:
            cur.execute(f'CREATE DATABASE "{DB_NAME}"')
    tmp_conn.close()
except Exception as e:
    print('Warning: could not ensure Postgres database exists (continuing).', e)

# Build SQLAlchemy URL (quote password)
db_pass_quoted = urllib.parse.quote_plus(DB_PASS)
app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql+psycopg2://{DB_USER}:{db_pass_quoted}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    ingredients = db.Column(db.Text, nullable=True)
    steps = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'ingredients': self.ingredients,
            'steps': self.steps,
            'created_at': self.created_at.isoformat()
        }


# Flask 3 removed `before_first_request`; create tables at startup instead
try:
    with app.app_context():
        db.create_all()
except Exception:
    # If creating tables fails (e.g., DB not reachable), let the app start and
    # surface errors on first DB access.
    pass


@app.route('/')
def index():
    # Dashboard: compute stats
    recipes = Recipe.query.order_by(Recipe.created_at.desc()).all()
    total = len(recipes)
    costs = []
    for r in recipes:
        cost = 0.0
        if r.ingredients:
            try:
                parsed = json.loads(r.ingredients)
                if isinstance(parsed, list):
                    cost = sum(float(i.get('cost', 0) or 0) for i in parsed)
            except Exception:
                # legacy comma-separated ingredients have no cost
                cost = 0.0
        costs.append((r, cost))

    total_cost_sum = sum(c for _, c in costs)
    avg_cost = (total_cost_sum / total) if total > 0 else 0.0
    cheapest = None
    most_expensive = None
    if costs:
        cheapest = min(costs, key=lambda x: x[1])[0]
        most_expensive = max(costs, key=lambda x: x[1])[0]

    # prepare simple dicts for template
    cheapest_info = {'id': cheapest.id, 'title': cheapest.title, 'cost': next(c for r,c in costs if r.id==cheapest.id)} if cheapest else None
    expensive_info = {'id': most_expensive.id, 'title': most_expensive.title, 'cost': next(c for r,c in costs if r.id==most_expensive.id)} if most_expensive else None

    return render_template('index.html', total_recipes=total, avg_cost=avg_cost, cheapest=cheapest_info, most_expensive=expensive_info, page='dashboard')


@app.route('/new')
def new_page():
    return render_template('new_recipe.html')


@app.route('/recipes')
def recipes_page():
    # server-render list page (shows titles and link to detail)
    recipes = Recipe.query.order_by(Recipe.created_at.desc()).all()
    recipes_info = []
    for r in recipes:
        ingredient_count = 0
        total_cost = 0.0
        if r.ingredients:
            try:
                parsed = json.loads(r.ingredients)
                if isinstance(parsed, list):
                    ingredient_count = len(parsed)
                    total_cost = sum(float(i.get('cost', 0) or 0) for i in parsed)
            except Exception:
                # legacy comma-separated string
                ingredient_count = len([s for s in (r.ingredients or '').split(',') if s.strip()])
                total_cost = 0.0
        recipes_info.append({
            'id': r.id,
            'title': r.title,
            'description': r.description,
            'created_at': r.created_at,
            'ingredient_count': ingredient_count,
            'total_cost': total_cost
        })
    return render_template('recipes.html', recipes=recipes_info, page='recipes')


@app.route('/recipes/<int:recipe_id>')
def recipe_page(recipe_id):
    r = Recipe.query.get_or_404(recipe_id)
    # Try to parse ingredients as JSON (structured ingredients with cost etc.)
    ingredients_list = []
    total_cost = 0.0
    if r.ingredients:
        try:
            parsed = json.loads(r.ingredients)
            if isinstance(parsed, list):
                ingredients_list = parsed
        except Exception:
            # fallback to legacy comma-separated string
            ingredients_list = []
            for ing in (r.ingredients or '').split(','):
                ing = ing.strip()
                if not ing:
                    continue
                # store as simple object with title only
                ingredients_list.append({'title': ing, 'quantity': '', 'unit': '', 'cost': 0})
    # compute total cost
    try:
        total_cost = sum(float(i.get('cost', 0) or 0) for i in ingredients_list)
    except Exception:
        total_cost = 0.0

    return render_template('recipe_detail.html', recipe=r, ingredients_list=ingredients_list, total_cost=total_cost)


@app.route('/api/recipes', methods=['GET'])
def list_recipes():
    recipes = Recipe.query.order_by(Recipe.created_at.desc()).all()
    return jsonify([r.to_dict() for r in recipes])


@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    r = Recipe.query.get_or_404(recipe_id)
    return jsonify(r.to_dict())


@app.route('/api/recipes', methods=['POST'])
def create_recipe():
    data = request.get_json() or {}
    title = data.get('title')
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    r = Recipe(
        title=title,
        description=data.get('description'),
        ingredients=data.get('ingredients'),
        steps=data.get('steps')
    )
    db.session.add(r)
    db.session.commit()
    return jsonify(r.to_dict()), 201


@app.route('/api/recipes/<int:recipe_id>', methods=['PUT'])
def update_recipe(recipe_id):
    r = Recipe.query.get_or_404(recipe_id)
    data = request.get_json() or {}
    title = data.get('title')
    if title is not None:
        r.title = title
    if 'description' in data:
        r.description = data.get('description')
    if 'ingredients' in data:
        r.ingredients = data.get('ingredients')
    if 'steps' in data:
        r.steps = data.get('steps')
    db.session.commit()
    return jsonify(r.to_dict())


@app.route('/api/recipes/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    r = Recipe.query.get_or_404(recipe_id)
    db.session.delete(r)
    db.session.commit()
    return jsonify({'result': 'deleted'})


if __name__ == '__main__':
    app.run(debug=True)