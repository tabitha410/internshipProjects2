from flask import Flask, render_template, request
import pandas as pd
import io
import base64
import matplotlib
import matplotlib.pyplot as plt
import json
import seaborn as sns
from urllib.request import urlopen

'''url = "https://kudata.com.ng/public/api/students"
response = urlopen(url)
data = json.loads(response.read())'''

with open('C:\\Users\\DELL\\Downloads\\data.json', 'r') as file:
    data = json.load(file)

# data = json.loads()

students = data['students']
df = pd.DataFrame(students)

app = Flask(__name__)

# Set matplotlib to use the 'Agg' backend for generating plots
matplotlib.use('Agg')


def generate_plot(df, title, x_label, y_label):
    plt.figure(figsize=(30, 10))
    ax = df.plot(kind='bar', stacked=True)
    plt.title(title)
    plt.xlabel(x_label)
    plt.ylabel(y_label)
    ax.legend(title='Department', bbox_to_anchor=(1.05, 1), loc='upper left')  # Move legend outside plot area
    # plt.xticks(rotation=45, ha='right')  # Rotate x-axis labels
    plt.subplots_adjust(right=0.75, bottom=0.25)  # Adjust margins to fit legend and x-axis label

    # Save plot to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', facecolor=ax.get_facecolor(), edgecolor='none')
    buf.seek(0)
    plot_url = base64.b64encode(buf.getvalue()).decode('utf8')
    plt.close()
    return plot_url


def generate_radar_chart(df, title, figsize=(5, 6)):
    categories = list(df.index)
    values = df.values.flatten().tolist()

    # We need to "close the circle" for the radar chart
    values += values[:1]
    categories += categories[:1]

    plt.figure(figsize=figsize)
    ax = plt.subplot(111, polar=True)

    ax.plot(categories, values, linewidth=2, linestyle='solid', color='#ffc600')
    ax.fill(categories, values, alpha=0.4, color='#ffc600')  # set fill color here

    plt.title(title)
    plt.tight_layout()

    # Save plot to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    plot_url = base64.b64encode(buf.getvalue()).decode('utf8')
    plt.close()
    return plot_url


def generate_pie_chart(df, title):
    plt.figure(figsize=(10, 6))  # Adjust the figsize as needed
    ax = df.plot.pie(autopct='%1.1f%%', startangle=90)
    plt.title(title)
    plt.ylabel('')  # Hide y-label for pie chart
    plt.axis('equal')  # Equal aspect ratio ensures the pie chart is circular.

    # Save plot to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    plot_url = base64.b64encode(buf.getvalue()).decode('utf8')
    plt.close()
    return plot_url


@app.route('/', methods=['GET', 'POST'])
def index():
    faculties = df['faculty_code'].str.strip().unique()

    if request.method == 'POST':
        plot_type = request.form.get('plot_type')
        selected_faculty = request.form.get('faculty')
        selected_column = request.form.get('column')  # get selected column for violin plot
        try:
            filtered_df = df[df['faculty_code'].str.strip() == selected_faculty]
            department_counts = filtered_df['department_code'].str.strip().value_counts()

            if plot_type == "bar":
                colors = plt.cm.get_cmap('viridis', len(department_counts))
                plt.figure(figsize=(7, 5))
                plt.bar(department_counts.index, department_counts.values,
                        color=[colors(i) for i in range(len(department_counts))])
                plt.title(f"Number of students in {selected_faculty} by Department")
                plt.xlabel("Department")
                plt.ylabel("Number of students")
                plt.grid(axis='y')
            elif plot_type == 'pie':
                plt.figure(figsize=(7, 5))
                department_counts.plot.pie(autopct='%1.1f%%')
                plt.title(f"Distribution of students in {selected_faculty} by Department")
                plt.ylabel('')  # Hide y-label for pie chart

            # Save plot to a bytes buffer
            buf = io.BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            plot_url = base64.b64encode(buf.getvalue()).decode('utf8')
            plt.close()

            # Generate radar chart based on user selection
            radar_chart_url = generate_radar_chart(department_counts,
                                                   f"Radar Chart of Departments in {selected_faculty}")

            return render_template('index.html', plot_url=plot_url, radar_chart_url=radar_chart_url, error=None,
                                   faculties=faculties)
        except Exception as e:
            error_message = str(e)
            return render_template('index.html', plot_url=None, violin_plot_url=None, error=error_message,
                                   faculties=faculties)
    else:
        # Group by faculty and department to get counts
        faculty_department_counts = df.groupby(['faculty_code', 'department_code']).size().unstack(fill_value=0)

        # filter out faculties with more than 4 students
        total_students_per_faculty = faculty_department_counts.sum(axis=1)
        filtered_faculty_department_counts = faculty_department_counts.loc[total_students_per_faculty > 4]

        plot_url = generate_plot(filtered_faculty_department_counts,
                                 'Distribution of Students by Faculty and Department', 'Faculty', 'Number of Students')
        # Generate a default radar chart
        department_counts = df['department_code'].str.strip().value_counts().head(5)
        radar_chart_url = generate_radar_chart(department_counts, 'Radar Chart of Top 5 Departments')

        return render_template('index.html', plot_url=plot_url, radar_chart_url=radar_chart_url, error=None,
                               faculties=faculties)


@app.route('/department')
def by_department():
    department_counts = df['department_code'].str.strip().value_counts().head(
        30)  # Select only the first 30 departments

    plt.figure(figsize=(20, 5))
    department_counts.plot(kind='bar', color='#ffc600')
    plt.title('Distribution of Students by Department')
    plt.xlabel('Department')
    plt.ylabel('Number of Students')

    # Save plot to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plot_url = base64.b64encode(buf.getvalue()).decode('utf8')
    plt.close()

    return render_template('index.html', plot_url=plot_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())


@app.route('/department_radar')
def by_department_radar():
    department_counts = df['department_code'].str.strip().value_counts()
    radar_chart_url = generate_radar_chart(department_counts, "Radar Chart of Departments with more than 30 Students",
                                           figsize=(25, 5))

    return render_template('index.html', radar_chart_url=radar_chart_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())


@app.route('/department_pie')
def by_department_pie():
    department_counts = df['department_code'].str.strip().value_counts().head(30)
    pie_chart_url = generate_pie_chart(department_counts, "Departmental Pie Chart")

    return render_template('index.html', pie_chart_url=pie_chart_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())


@app.route('/level')
def by_level():
    level_counts = df['current_level'].str.strip().value_counts()
    level_counts = level_counts[level_counts > 10]

    plt.figure(figsize=(15, 5))
    level_counts.plot(kind='bar', color='#ffc600')  # Set bar color here
    plt.title('Distribution of Students by Level')
    plt.xlabel('Level')
    plt.ylabel('Number of Students')

    # Save plot to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plot_url = base64.b64encode(buf.getvalue()).decode('utf8')
    plt.close()

    return render_template('index.html', plot_url=plot_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())


@app.route('/level_radar')
def by_level_radar():
    level_counts = df['current_level'].str.strip().value_counts()
    level_counts = level_counts[level_counts > 10]
    radar_chart_url = generate_radar_chart(level_counts, "Radar Chart of Levels with more than 10 Students",
                                           figsize=(25, 5))

    return render_template('index.html', radar_chart_url=radar_chart_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())


@app.route('/level_pie')
def by_level_pie():
    level_counts = df['current_level'].str.strip().value_counts()
    level_counts = level_counts[level_counts > 10]
    pie_chart_url = generate_pie_chart(level_counts, "Pie Chart for Levels")

    return render_template('index.html', pie_chart_url=pie_chart_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())


@app.route('/faculty')
def by_faculty():
    '''faculty_department_counts = df.groupby(['faculty_code', 'department_code']).size().unstack(fill_value=0)
    plot_url = generate_plot(faculty_department_counts, 'Distribution of Students by Faculty and Department', 'Faculty',
                             'Number of Students')
    return render_template('index.html', plot_url=plot_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())'''

    faculty_counts = df['faculty_code'].str.strip().value_counts()
    faculty_counts = faculty_counts[faculty_counts > 10]

    plt.figure(figsize=(20, 5))
    faculty_counts.plot(kind='bar', color='#ffc600')  # Set bar color here
    plt.title('Distribution of Students by Faculty')
    plt.xlabel('Faculty')
    plt.ylabel('Number of Students')

    # Save plot to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plot_url = base64.b64encode(buf.getvalue()).decode('utf8')
    plt.close()

    return render_template('index.html', plot_url=plot_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())


@app.route('/faculty_radar')
def by_faculty_radar():
    faculty_counts = df['faculty_code'].str.strip().value_counts()
    faculty_counts = faculty_counts[faculty_counts > 10]
    radar_chart_url = generate_radar_chart(faculty_counts, "Radar Chart of Faculties with more than 10 Students",
                                           figsize=(25, 5))

    return render_template('index.html', radar_chart_url=radar_chart_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())


@app.route('/faculty_pie')
def by_faculty_pie():
    faculty_counts = df['faculty_code'].str.strip().value_counts()
    faculty_counts = faculty_counts[faculty_counts > 100]
    pie_chart_url = generate_pie_chart(faculty_counts, "Pie Chart of Faculties with more than 20 Students")

    return render_template('index.html', pie_chart_url=pie_chart_url, error=None,
                           faculties=df['faculty_code'].str.strip().unique())


if __name__ == '__main__':
    app.run(debug=True, port=5003)
