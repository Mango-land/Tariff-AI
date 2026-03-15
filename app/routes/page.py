from flask import Blueprint, render_template, redirect, url_for

page_bp = Blueprint('page', __name__)

@page_bp.route('/')
def index():
    return redirect(url_for('page.home'))

@page_bp.route('/home')
def home():
    return render_template('page/index.html')

@page_bp.route('/search')
def search():
    return render_template('page/search.html')

@page_bp.route('/ai_search')
def ai_search():
    return render_template('page/ai_search.html')

@page_bp.route('/compare')
def compare():
    return render_template('page/compare.html')