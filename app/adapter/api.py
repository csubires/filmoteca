#!/usr/bin/env python3
"""
Flask API wrapper to run adapter tasks in background threads.
Provides endpoints: /execute_task, /task_status, /stop_task
"""
import sys
import os
import uuid
import time
import threading
import re
from flask import Flask, request, jsonify
from contextlib import redirect_stdout, redirect_stderr

# Add app root to path for imports
app_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, app_root)

from adapter import interface as interface_mod

app = Flask(__name__)

active_tasks = {}
active_tasks_lock = threading.Lock()


class StreamInterceptor:
    def __init__(self, on_line):
        self._buf = ''
        self.on_line = on_line

    def write(self, s):
        if not s:
            return
        self._buf += s
        while '\n' in self._buf:
            line, self._buf = self._buf.split('\n', 1)
            line = line.strip()
            if line:
                self.on_line(line)

    def flush(self):
        if self._buf:
            line = self._buf.strip()
            if line:
                self.on_line(line)
            self._buf = ''


def append_task_output(task_data, line: str):
    if not line:
        return
    task_data['output'] += line + '\n'
    # PROGRESO:N
    m = re.search(r'PROGRESO:(\d+)', line)
    if m:
        try:
            task_data['progress'] = int(m.group(1))
        except Exception:
            pass

    if line.startswith('LOG:'):
        task_data['message'] = line.replace('LOG:', '').strip()

    if 'TAREA COMPLETADA' in line or 'PROGRESO:100' in line:
        task_data['status'] = 'completed'


def start_handler_thread(task_name, task_config):
    task_id = f"{task_name}_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
    task_data = {
        'id': task_id,
        'task': task_name,
        'status': 'pending',
        'progress': 0,
        'message': 'Pending',
        'output': '',
        'start_time': time.time(),
        'should_stop': False,
    }

    def worker():
        with active_tasks_lock:
            task_data['status'] = 'running'
        def should_continue():
            return not task_data['should_stop']

        interceptor = StreamInterceptor(lambda line: append_task_output(task_data, line))

        handler = interface_mod.TASK_HANDLERS.get(task_name)
        if not handler:
            task_data['status'] = 'failed'
            task_data['message'] = f'Unknown task: {task_name}'
            return

        try:
            # Redirect stdout/stderr so prints inside handlers are captured
            with redirect_stdout(interceptor), redirect_stderr(interceptor):
                result = handler(task_config or {}, should_continue)

            if isinstance(result, dict) and result.get('status') == 'completed':
                task_data['status'] = 'completed'
                task_data['progress'] = 100
                task_data['message'] = result.get('message', 'Completed')
            else:
                if isinstance(result, dict):
                    task_data['status'] = result.get('status', 'failed')
                    task_data['message'] = result.get('message', '')
                    if task_data['status'] == 'completed':
                        task_data['progress'] = 100
                else:
                    task_data['status'] = 'completed'
                    task_data['progress'] = 100
                    task_data['message'] = 'Completed'
        except Exception as e:
            import traceback
            traceback.print_exc()
            task_data['status'] = 'failed'
            task_data['message'] = str(e)
        finally:
            if task_data['status'] == 'running' and not task_data['should_stop']:
                task_data['status'] = 'completed'
                if task_data.get('progress', 0) < 100:
                    task_data['progress'] = 100
                if not task_data.get('message') or task_data.get('message') == 'Pending':
                    task_data['message'] = 'Completed'

    th = threading.Thread(target=worker, daemon=True)
    with active_tasks_lock:
        active_tasks[task_id] = task_data
    th.start()
    return task_id


@app.route('/execute_task', methods=['POST'])
def execute_task():
    payload = request.get_json(force=True, silent=True) or {}
    task = payload.get('task')
    config = payload.get('config') or {}
    if not task:
        return jsonify({'error': 'No task specified'}), 400

    task_id = start_handler_thread(task, config)
    return jsonify({'taskId': task_id}), 200


@app.route('/task_status', methods=['GET'])
def task_status():
    task_id = request.args.get('taskId')
    if not task_id:
        return jsonify({'data': {'task_status': 'no_task'}}), 200
    with active_tasks_lock:
        task = active_tasks.get(task_id)
    if not task:
        return jsonify({'data': {'task_status': 'not_found'}}), 200

    return jsonify({'data': {
        'task_status': task['status'],
        'progress': task.get('progress', 0),
        'message': task.get('message'),
        'error': task.get('error'),
        'output': task.get('output')
    }}), 200


@app.route('/stop_task', methods=['POST'])
def stop_task():
    payload = request.get_json(force=True, silent=True) or {}
    task_id = payload.get('taskId')
    if not task_id:
        return jsonify({'success': False, 'message': 'No taskId provided'}), 400
    with active_tasks_lock:
        task = active_tasks.get(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found'}), 200

    task['should_stop'] = True
    task['status'] = 'stopping'
    return jsonify({'success': True, 'message': 'Stopping task'}), 200

@app.route("/health", methods=['GET'])
def health():
    return {"status": "ok"}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('ADAPTER_PORT', 5000)), debug=True)
