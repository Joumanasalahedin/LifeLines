import pandas as pd

# Load the CSV file
data = pd.read_csv('life_vs_gdp.csv')

data_2020 = data[data['Year'] == 2020]
data_2020.to_csv("data_2020.csv", index=False)
