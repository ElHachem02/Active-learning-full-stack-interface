import csv

csv_file = "bird_species.csv"
output_file = "mapping.txt"

common_name_to_label = {}

# Read CSV with BOM-safe encoding
with open(csv_file, "r", encoding="utf-8-sig") as file:
    reader = csv.DictReader(file)
    for row in reader:
        common_name = row["common_name"].strip()
        primary_label = row["primary_label"].strip()
        common_name_to_label[common_name] = primary_label

# Save the dictionary as a literal (Python syntax)
with open(output_file, "w", encoding="utf-8") as f:
    f.write("{\n")
    for name, label in common_name_to_label.items():
        f.write(f'    "{name}": "{label}",\n')
    f.write("}\n")
