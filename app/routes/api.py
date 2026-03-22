from flask import Blueprint
from flask import jsonify

from config import Config

from pathlib import Path

import json

api_blueprint = Blueprint('api', __name__, url_prefix='/api')

@api_blueprint.route('/get/all_tariffs', methods=['GET'])
def get_all_tariffs():
    try:
        path = Path(Config.TARIFFS_ROOT)

        if not path.exists():
            print(f'Directory not found: {path}')
            return jsonify({'success': False, 'error': 'Directory not found'}), 404

        tariffs = []
        for json_file in path.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                    tariffs.append(data)
            except json.JSONDecodeError:
                print(f'Json pars error: {json_file.name}')
                return jsonify({'success': False, 'error': 'Server error'}), 400

        return jsonify({
            'success': True,
            'tariffs': tariffs,
        }), 200
    except Exception as exception:
        print(f'Error: {exception}')
        return jsonify({'success': False, 'error': 'Server error'}), 400