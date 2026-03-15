from app.models import database

class Tariff(database.Model):
    id = database.Column(database.Integer, primary_key=True)

    name = database.Column(database.String(100), nullable=False)
    operator = database.Column(database.String(50), nullable=False)

    price = database.Column(database.Integer, nullable=False)
    gb = database.Column(database.Integer, default=-1)
    minutes = database.Column(database.Integer, default=-1)
    sms = database.Column(database.Integer, default=-1)

    unlimited_messengers = database.Column(database.Boolean, default=False)
    unlimited_social = database.Column(database.Boolean, default=False)
    unlimited_video = database.Column(database.Boolean, default=False)
    unlimited_music = database.Column(database.Boolean, default=False)

    description = database.Column(database.Text)
    link = database.Column(database.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "operator": self.operator,
            "name": self.name,
            "price": self.price,
            "gb": self.gb,
            "minutes": self.minutes,
            "sms": self.sms,
            "description": self.description
        }