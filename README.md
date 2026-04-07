# Recetario Leewenhoek

Pequeña aplicación para listar, crear, editar y eliminar recetas.

Requisitos:

- Python 3.8+
- Instalar dependencias: `pip install -r requirements.txt`

Ejecutar localmente (desarrollo):

```powershell
pip install -r requirements.txt; python main.py
```

La app queda disponible en `http://127.0.0.1:5000/`.

Ejecución con Gunicorn (producción / servidor WSGI):

```powershell
pip install -r requirements.txt
# Ejecuta con 4 workers y bind en el puerto 8000
gunicorn -w 4 -b 0.0.0.0:8000 wsgi:app
```

Nota: Gunicorn no se ejecuta en Windows nativamente. En Windows usa el comando `python main.py` para desarrollo, o despliega en Linux/WSL/contenerizador para Gunicorn.
