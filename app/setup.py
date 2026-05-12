#!/usr/bin/python3
from setuptools import setup
from pkg_resources import parse_requirements
import pathlib

with pathlib.Path('requirements.txt').open() as requirements_txt:
	install_requires = [
		str(requirement)
		for requirement in parse_requirements(requirements_txt)
	]

with open("docs/README.md", 'r') as f:
    long_description = f.read()

setup(
	name='Filmoteca',
	version='2.1.0',
	description='Proyecto para gestionar las películas',
	author='csubires',
	author_email='develop@servermedia.local',
	long_description=long_description,
	url='https://github.com/csubires',
	license='Apache',
	install_requires=install_requires,
	entry_points={
		'console_scripts': [
			'scan=filmoteca.main:main',
			'server=filmoteca.server:__main__',
			'test=tests:algo'
		]
	},
	setup_requires=['flake8', 'matplotlib'],
	tests_require=['unittest'],
	scripts=[
				'scripts/deploy.sh',
			]
)
