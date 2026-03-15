from flask import Blueprint, jsonify, request
from app.models import Tariff

api_bp = Blueprint('api', __name__)

@api_bp.route('/search', methods=['POST'])
def search_tariffs():
    try:
        data = request.get_json()

        min_price = data.get('min_price', 0)
        max_price = data.get('max_price', 999999)
        min_gb = data.get('min_gb', 0)
        max_gb = data.get('max_gb', 0)
        min_minutes = data.get('min_minutes', 0)
        max_minutes = data.get('max_minutes', 0)
        min_sms = data.get('min_sms', 0)
        max_sms = data.get('max_sms', 0)

        operators = data.get('operators', [])

        unlimited_messengers = data.get('unlimited_messengers', False)
        unlimited_social = data.get('unlimited_social', False)
        unlimited_video = data.get('unlimited_video', False)
        unlimited_music = data.get('unlimited_music', False)

        q = data.get('q', '')

        query = Tariff.query

        query = query.filter(Tariff.price >= min_price)
        query = query.filter(Tariff.price <= max_price)

        query = query.filter(Tariff.gb >= min_gb)
        query = query.filter(Tariff.gb <= max_gb)

        query = query.filter(Tariff.minutes >= min_minutes)
        query = query.filter(Tariff.minutes <= max_minutes)

        query = query.filter(Tariff.sms >= min_sms)
        query = query.filter(Tariff.sms <= max_sms)

        if operators:
            query = query.filter(Tariff.operator.in_(operators))

        if unlimited_messengers:
            query = query.filter(Tariff.unlimited_messengers == True)
        if unlimited_social:
            query = query.filter(Tariff.unlimited_social == True)
        if unlimited_video:
            query = query.filter(Tariff.unlimited_video == True)
        if unlimited_music:
            query = query.filter(Tariff.unlimited_music == True)

        if q:
            query = query.filter(
                (Tariff.name.icontains(q)) | (Tariff.operator.icontains(q))
            )

        results = query.all()
        result = [t.to_dict() for t in results]

        return jsonify({'success': True, 'data': result})
    except Exception as exception:
        return jsonify({'success': False, 'error': str(exception)})