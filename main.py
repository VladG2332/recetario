from flask import Flask, render_template, request, jsonify, abort, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pymysql
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)

DB_USER = 'root'
DB_PASS = 'root'
DB_HOST = 'localhost'
DB_PORT = 3306
DB_NAME = 'recetario'

try:
    # Use PyMySQL directly to ensure the database exists
    conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, port=DB_PORT)
    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn.commit()
    conn.close()
except Exception as e:
    # Print a warning so it's visible in the logs if DB creation fails
    print('Warning: could not create database', e)

app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
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
    return redirect(url_for('recipes_page'))


@app.route('/new')
def new_page():
    return render_template('new_recipe.html')


@app.route('/recipes')
def recipes_page():
    # server-render list page (shows titles and link to detail)
    recipes = Recipe.query.order_by(Recipe.created_at.desc()).all()
    return render_template('recipes.html', recipes=recipes)


@app.route('/recipes/<int:recipe_id>')
def recipe_page(recipe_id):
    r = Recipe.query.get_or_404(recipe_id)
    return render_template('recipe_detail.html', recipe=r)


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