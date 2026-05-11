from modules.service			import HandlerService as HandlerServiceMod
from modules.torrent			import get_torrents
from modules.utils				import lg_prt, singleton, dt_format
from modules.database			import Handler_SQL
from config.queries_database	import *
from config.global_constant	    import *

oDTB = Handler_SQL(DB_FILE, TAG_QUERY_REPORT)
oSRVC = HandlerServiceMod(oDTB)

cache_storage = {}
data = cache_storage.get('cache_torrent', None)
cache_storage['task_status'] = 'No completed'
year = None

# Obtener valores de la base de datos si no hay año especificado
if year is None:
	result = oDTB.execute('select_urlend')
	url_end, date_end, npseries = result[0] if result else (None, None, None)

	# Si la fecha no coincide o no hay datos en caché, obtener nuevos torrents
	if date_end != dt_format("symd") or data is None:
		if oSRVC is None:
			oSRVC = HandlerServiceMod(oDTB)
		data = get_torrents(oSRVC.oCNT, url_end, npseries)
		# Actualizar base de datos y caché si se obtuvieron nuevos datos
		if data and len(data) > 2:
			oDTB.execute('update_urlend', {
				'url_end': data[2],
				'date_end': dt_format("symd"),
				'npseries': data[3] if len(data) > 3 else npseries
			})
			cache_storage['cache_torrent'] = data
else:
	url_end, date_end, npseries = (
		data[2] if data else None,
		dt_format("symd"),
		data[3] if data and len(data) > 3 else None
	)

cache_storage['task_status'] = 'completed'
if year is None:
	response = ('Torrent Downloads', 'torrent.html', data)
else:
	response = ('Cartelera', 'torrent.html', [None, url_end, date_end, npseries])
