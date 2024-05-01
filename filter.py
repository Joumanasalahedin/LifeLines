import pandas as pd

# Load the CSV file
data = pd.read_csv('life-expectancy.csv')

# Filter the data for the year 2020
data_2020 = data[data['Year'] == 1966]

# Save the filtered data to a new CSV file
data_2020.to_csv('life-expectancy-1966.csv', index=False)
