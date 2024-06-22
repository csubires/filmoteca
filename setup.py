#!/usr/bin/python3
from setuptools import setup
from pkg_resources import parse_requirements
import pathlib

with pathlib.Path('requirements.txt').open() as requirements_txt:
	install_requires = [
		str(requirement)
		for requirement in parse_requirements(requirements_txt)
	]

setup(
	name='Filmoteca',
	version='1.1.0',
	description='Proyecto para gestionar las películas',
	author='Sr. cjsm',
	author_email='develop@servermedia.com',
	url='http://192.168.65.22',
	license='Apache',
	install_requires=install_requires,
	entry_points={
		'console_scripts': [
			'scan=filmoteca.main:main',
			'server=filmoteca.server:__main__',
			'test=tests:algo'
		]
	},

	setup_requires=['flake8'],
	tests_require=['unittest']
)
