import pandas as pd


def combine_csv_files_with_continent(population_file, birth_rate_file, life_expectancy_file, additional_file, output_file):
    population_df = pd.read_csv(population_file)
    birth_rate_df = pd.read_csv(birth_rate_file)
    life_expectancy_df = pd.read_csv(life_expectancy_file)
    additional_df = pd.read_csv(additional_file)

    # Extract necessary columns from the additional file
    continent_df = additional_df[['Entity', 'Code', 'Year', 'Continent']]

    # Merge the dataframes on 'Entity', 'Code', and 'Year'
    combined_df = pd.merge(population_df, birth_rate_df,
                           on=['Entity', 'Code', 'Year'])
    combined_df = pd.merge(combined_df, life_expectancy_df, on=[
                           'Entity', 'Code', 'Year'])
    combined_df = pd.merge(combined_df, continent_df,
                           on=['Entity', 'Code', 'Year'])

    combined_df.columns = ['Entity', 'Code', 'Year', 'Population',
                           'Birth rate', 'Period life expectancy at birth', 'Continent']

    combined_df.to_csv(output_file, index=False)

    return combined_df


# Example usage
# population_file = 'population.csv'
# birth_rate_file = 'birth-rate.csv'
# life_expectancy_file = 'life-expectancy.csv'
# additional_file = 'life_vs_gdp.csv'
# output_file = 'bubble_data.csv'

# combined_df = combine_csv_files_with_continent(
#     population_file, birth_rate_file, life_expectancy_file, additional_file, output_file)
# print(combined_df)

# Load the combined data
data = pd.read_csv('bubble_data.csv')
data_2020 = data[data['Year'] == 2020]
data_2020.to_csv("bubble_2020.csv", index=False)
