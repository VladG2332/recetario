from main import app

# Gunicorn looks for a variable named "application" or you can point to `wsgi:app`.
# We'll expose `app` so you can run `gunicorn -w 4 -b 0.0.0.0:8000 wsgi:app`.

if __name__ == '__main__':
    app.run()
