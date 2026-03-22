from flask import Blueprint, redirect, url_for, render_template

page_blueprint = Blueprint('page', __name__)

@page_blueprint.route('/')
def index():
    return redirect(url_for('page.home'))

@page_blueprint.route('/home')
def home():
    return render_template('home.html')

@page_blueprint.route('/search')
def search():
    return render_template('search.html')

@page_blueprint.route('/search_ai')
def search_ai():
    return render_template('search_ai.html')

@page_blueprint.route('/compare')
def compare():
    return render_template('compare.html')