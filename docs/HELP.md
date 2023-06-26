

## Crear y usar un entorno virtual
```
virtualenv -p python3 .venv
source .venv/bin/activate
install -r requirements.txt 
pip3 freeze requirements.txt
deactivate
```

## Crear setup
```
python3 setup.py sdist
python3 setup.py install
python3 setup.py develop
python3 setup.py build
```


[Configurar Flask](https://runebook.dev/es/docs/flask/config/index)

# cat /dev/urandom | LANG=C tr -dc '[:alnum:]' | head -c 32 ; echo