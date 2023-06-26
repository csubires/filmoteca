# 2023.03.18
# python3 -m www.graphic.run
import matplotlib.pyplot as plt						# Generar gráficas con los datos de la BBDD

from modules.auxiliary import date_to_human
from modules.utils import lg_prt					# Mostrar y Colorear texto en consola

from config.global_constant import PATH_CHARTS


class HandlerChart:

	def __init__(self, title, x_label, y_label, x_data, y_data, file):
		plt.clf()
		self.result = True
		self.title = title
		self.x_label = x_label
		self.y_label = y_label
		self.x_data = x_data
		self.y_data = y_data
		self.file = file

	def __del__(self):
		pass
		# del plt

	def draw_line(self):
		try:
			plt.rc('xtick', labelsize=7)
			plt.plot(self.x_data, self.y_data, color='#30a2da', linewidth=2.0)
			plt.title(self.title)
			plt.xlabel(self.x_label)
			plt.ylabel(self.y_label)
			plt.gcf().autofmt_xdate()
			plt.rcParams['axes.facecolor'] = '#ffffff'
			# plt.rcParams['savefig.facecolor'] = '#f8f9f9'
			plt.savefig(self.file, bbox_inches='tight', transparent=True)
			lg_prt('gygv', '[✔] Correctly generated graph', self.title, 'and save at', self.file)
		except Exception:
			lg_prt('ryrv', '[✖] Error generating graph', self.title, 'and save at', self.file)
			self.result = False
		finally:
			return self.result

	def draw_pie(self):
		try:
			plt.rc('xtick', labelsize=6)
			_, ax = plt.subplots()
			plt.title(self.title)
			ax.pie(self.x_data, labels=self.y_data, autopct='%1.1f', pctdistance=0.8, shadow=False, startangle=90, radius=1.5)
			ax.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
			plt.rcParams['axes.facecolor'] = '#ffffff'
			# plt.rcParams['savefig.facecolor'] = '#f8f9f9'
			plt.savefig(self.file, bbox_inches='tight', transparent=True)
			lg_prt('gygv', '[✔] Correctly generated graph', self.title, 'and save at', self.file)
		except Exception:
			lg_prt('ryrv', '[✖] Error generating graph', self.title, 'and save at', self.file)
			self.result = False
		finally:
			return self.result

	def draw_scatter(self):
		try:
			plt.rc('xtick', labelsize=9)
			plt.rc('ytick', labelsize=9)
			plt.grid(True)
			plt.scatter(self.x_data, self.y_data)
			plt.title(self.title)
			plt.xlabel(self.x_label)
			plt.ylabel(self.y_label)
			plt.gcf().autofmt_xdate()
			plt.savefig(self.file, bbox_inches='tight', transparent=True)
			lg_prt('gygv', '[✔] Correctly generated graph', self.title, 'and save at', self.file)
		except Exception:
			lg_prt('ryrv', '[✖] Error generating graph', self.title, 'and save at', self.file)
			self.result = False
		finally:
			return self.result

	def draw_bar(self):
		try:
			plt.figure(figsize=(20, 10))
			plt.rc('xtick', labelsize=20)
			plt.rc('ytick', labelsize=20)
			plt.bar(self.x_data, self.y_data[1], color='#30a2da')
			plt.title(self.title)
			plt.xlabel(self.x_label)
			plt.ylabel(self.y_label)
			plt.gcf().autofmt_xdate()
			plt.xticks(self.x_data, self.y_data[0])
			plt.savefig(self.file, bbox_inches='tight', transparent=True)
			lg_prt('gygv', '[✔] Correctly generated graph', self.title, 'and save at', self.file)
		except Exception:
			lg_prt('ryrv', '[✖] Error generating graph', self.title, 'and save at', self.file)
			self.result = False
		finally:
			return self.result

	def draw_barh(self):
		try:
			plt.figure(figsize=(10, 50))
			plt.rc('xtick', labelsize=20)
			plt.rc('ytick', labelsize=20)
			plt.barh(self.x_data, self.y_data[0], color='#30a2da')
			for i, v in enumerate(self.y_data[0]):
				plt.text(v, i, str(v), color='#30a2da')
			plt.grid(True)
			plt.title(self.title)
			plt.xlabel(self.x_label)
			plt.ylabel(self.y_label)
			plt.gcf().autofmt_xdate()
			plt.yticks(self.x_data, self.y_data[1])
			plt.savefig(self.file, bbox_inches='tight', transparent=True)
			lg_prt('gygv', '[✔] Correctly generated graph', self.title, 'and save at', self.file)
		except Exception:
			lg_prt('ryrv', '[✖] Error generating graph', self.title, 'and save at', self.file)
			self.result = False
		finally:
			return self.result


def draw_graphic(oDTB):
	# Generar gráficas
	count_chart = 0
	result = False

	# --- INTERNAL HDD ---

	rows = oDTB.execute('report_bd_01', {'hdd_code': 0})
	listRows = list(zip(*rows))
	format_date = tuple(map(date_to_human, listRows[0]))

	# Número de películas por reporte (Repositorio Interno)
	title = 'Número de películas por reporte (Repositorio Interno)'
	x_label = 'Fecha de reporte'
	y_label = 'Número de películas'
	x_data = format_date
	y_data = listRows[1]
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_line()

	# Tamaño del repositorio (Repositorio Interno)
	values = tuple(map(lambda x: round(x / pow(1024, 3), 2), listRows[2]))
	title = 'Tamaño del repositorio (Repositorio Interno)'
	x_label = 'Fecha de reporte'
	y_label = f'Tamaño en Gigabytes. Actual: {rows[-1][4]}'
	x_data = format_date
	y_data = values
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_line()

	# Duración del repositorio (Repositorio Interno)
	values = tuple(map(lambda x: round(x // 3600, 2), listRows[3]))
	title = 'Duración del repositorio (Repositorio Interno)'
	x_label = 'Fecha de reporte'
	y_label = f'Duración en horas. Actual: {(rows[-1][3]/3600)}'
	x_data = format_date
	y_data = values
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_line()

	# Añadidas a la filmoteca (Repositorio Interno)
	title = 'Añadidas a la filmoteca (Repositorio Interno)'
	x_label = 'Fecha de reporte'
	y_label = 'Número de películas'
	x_data = format_date
	y_data = listRows[5]
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_line()

	# --- EXTERNAL HDD ---

	rows = oDTB.execute('report_bd_01', {'hdd_code': 1})
	listRows = list(zip(*rows))
	format_date = tuple(map(date_to_human, listRows[0]))

	# Número de películas por reporte (Repositorio Externo)
	title = 'Número de películas por reporte (Repositorio Externo)'
	x_label = 'Fecha de reporte'
	y_label = 'Número de películas'
	x_data = format_date
	y_data = listRows[1]
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_line()

	# Tamaño del repositorio (Repositorio Externo)
	values = tuple(map(lambda x: round(x / pow(1024, 3), 2), listRows[2]))
	title = 'Tamaño del repositorio (Repositorio Externo)'
	x_label = 'Fecha de reporte'
	y_label = f'Tamaño en Gigabytes. Actual: {rows[-1][4]}'
	x_data = format_date
	y_data = values
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_line()

	# Duración del repositorio (Repositorio Externo)
	values = tuple(map(lambda x: round(x // 3600, 2), listRows[3]))
	title = 'Duración del repositorio (Repositorio Externo)'
	x_label = 'Fecha de reporte'
	y_label = f'Duración en horas. Actual: {(rows[-1][3]/3600)}'
	x_data = format_date
	y_data = values
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_line()

	# Añadidas a la filmoteca (Repositorio Externo)
	title = 'Añadidas a la filmoteca (Repositorio Externo)'
	x_label = 'Fecha de reporte'
	y_label = 'Número de películas'
	x_data = format_date
	y_data = listRows[5]
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_line()

	# --- GLOBAL ---

	# Porcentaje (100%) de películas por género
	rows = oDTB.execute('report_bd_02')
	listRows = list(zip(*rows))
	labels = tuple(map(lambda x: x.capitalize(), listRows[0]))
	sizes = tuple(map(lambda x: 0 if x is None else x, listRows[1]))
	title = 'Porcentaje (100%) de películas por género'
	x_data = sizes
	y_data = labels
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, None, None, x_data, y_data, file)
	result = new_chart.draw_pie()

	# Porcentaje (100%) de películas por repositorio
	rows = oDTB.execute('report_bd_07')
	listRows = list(zip(*rows))
	labels = tuple(map(lambda x: x.upper(), listRows[1]))
	sizes = tuple(map(lambda x: 0 if x is None else x, listRows[0]))
	title = 'Porcentaje (100%) de películas por repositorio'
	x_data = sizes
	y_data = labels
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, None, None, x_data, y_data, file)
	result = new_chart.draw_pie()

	# Dispersión de valoraciónes por película (Repositorio Interno)
	rows = oDTB.execute('report_bd_05', {'hdd_code': 0})
	listRows = list(zip(*rows))
	title = 'Valoraciones de películas (Repositorio Interno)'
	x_label = 'Número de películas con valoración X'
	y_label = 'Valoración'
	x_data = listRows[0]
	y_data = listRows[1]
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_scatter()

	# Dispersión de valoraciónes por película (Repositorio Externo)
	rows = oDTB.execute('report_bd_05', {'hdd_code': 1})
	listRows = list(zip(*rows))
	title = 'Valoraciones de películas (Repositorio Externo)'
	x_label = 'Número de películas con valoración X'
	y_label = 'Valoración'
	x_data = listRows[0]
	y_data = listRows[1]
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_scatter()

	# Gráfica de barras horizontal con el número de películas por año
	rows = oDTB.execute('report_bd_03')
	listRows = list(zip(*rows))
	x_pos = [i for i, _ in enumerate(listRows[1])]
	title = 'Número de películas por año de estreno'
	x_label = 'Número de películas'
	y_label = 'Año de estreno'
	x_data = x_pos
	y_data = (listRows[0], listRows[1])
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_barh()

	# Gráfica de barras horizonal con el número de películas por país
	rows = oDTB.execute('report_bd_04')
	listRows = list(zip(*rows))
	x_pos = [i for i, _ in enumerate(listRows[1])]
	title = 'Número de películas por país'
	x_label = 'Número de películas'
	y_label = 'País'
	x_data = x_pos
	y_data = (listRows[0], listRows[1])
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_barh()

	# Gráfica de barras vertical con el número de películas por extensión
	rows = oDTB.execute('report_bd_06')
	listRows = list(zip(*rows))
	x_pos = [i for i, _ in enumerate(listRows[0])]
	title = 'Número de películas por extensión'
	x_label = 'Extensión'
	y_label = 'Número de películas'
	x_data = x_pos
	y_data = (listRows[1], listRows[0])
	file = f'{PATH_CHARTS}plot{count_chart}.png'
	count_chart += 1
	new_chart = HandlerChart(title, x_label, y_label, x_data, y_data, file)
	result = new_chart.draw_bar()

	lg_prt('g', '[✔] Generación de gráficas terminada')
	del new_chart
	del oDTB
	return result
