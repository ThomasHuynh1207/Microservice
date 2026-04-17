INSERT INTO food_items (id, name, category, calories_per100g, protein_per100g, carbs_per100g, fat_per100g) VALUES
(1, 'Ức gà nướng', 'protein', 165, 31, 0, 4),
(2, 'Cơm gạo lứt', 'carb', 111, 2, 23, 1),
(3, 'Bông cải xanh', 'vegetable', 34, 3, 7, 0),
(4, 'Trứng luộc', 'protein', 155, 13, 1, 11),
(5, 'Yogurt Hy Lạp', 'dairy', 59, 10, 3, 0),
(6, 'Quả bơ', 'fat', 160, 2, 9, 15);

INSERT INTO food_item_tags (food_item_id, tag) VALUES
(1, 'breakfast'), (1, 'lunch'), (1, 'dinner'), (1, 'protein'),
(2, 'lunch'), (2, 'dinner'), (2, 'carb'),
(3, 'breakfast'), (3, 'lunch'), (3, 'dinner'), (3, 'balanced'),
(4, 'breakfast'), (4, 'lunch'), (4, 'snack'), (4, 'protein'),
(5, 'breakfast'), (5, 'snack'), (5, 'balanced'),
(6, 'lunch'), (6, 'dinner'), (6, 'fat');

INSERT INTO food_item_allergens (food_item_id, allergen) VALUES
(5, 'dairy');
