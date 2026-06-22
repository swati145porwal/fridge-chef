-- Seed FridgeChef Recipes with Nutrition Data

INSERT INTO recipes (name, core, diet, meal, cuisines, allergens, avoid, health, time, cal, description, pairing, steps, yt_query, protein, carbs, fat, fiber) VALUES
-- Dal Recipes
('Dal Tadka', 'Toor Dal', 'veg', ARRAY['lunch', 'dinner'], ARRAY['North Indian', 'Punjabi'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['High Protein', 'Heart Healthy'], '30 min', 180, 'Comfort dal tempered with cumin, garlic and dried red chilies. A everyday staple.', 'Jeera Rice + Papad', ARRAY['Pressure cook toor dal until soft', 'Heat ghee, add cumin, garlic, dry red chili', 'Add tomato puree and cook', 'Add dal, season and simmer', 'Garnish with coriander'], 'dal tadka recipe', 12, 28, 4, 8),

('Dal Makhani', 'Urad Dal', 'veg', ARRAY['dinner'], ARRAY['Punjabi', 'North Indian'], ARRAY['Dairy'], ARRAY[]::TEXT[], ARRAY['High Protein'], '60 min', 320, 'Creamy black lentils slow-cooked with butter and cream. Restaurant style richness.', 'Butter Naan + Onion Salad', ARRAY['Soak urad dal and rajma overnight', 'Pressure cook until very soft', 'Prepare tomato-onion masala', 'Simmer dal with masala, butter and cream', 'Cook on low heat for rich texture'], 'dal makhani recipe', 14, 32, 16, 10),

('Chana Dal', 'Chana Dal', 'veg', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['High Protein', 'Diabetic Friendly'], '40 min', 200, 'Split chickpea lentils with mild spices. Low glycemic and nutritious.', 'Roti + Pickle', ARRAY['Soak chana dal for 30 mins', 'Pressure cook with turmeric', 'Prepare onion-tomato tadka', 'Add cooked dal and simmer', 'Finish with garam masala'], 'chana dal recipe', 13, 30, 5, 11),

('Sambar', 'Toor Dal', 'vegan', ARRAY['breakfast', 'lunch', 'dinner'], ARRAY['South Indian'], ARRAY[]::TEXT[], ARRAY['Onion', 'Garlic'], ARRAY['High Fiber'], '45 min', 150, 'Tangy lentil stew with vegetables and tamarind. South Indian essential.', 'Idli/Dosa + Coconut Chutney', ARRAY['Cook toor dal until mushy', 'Boil vegetables separately', 'Make sambar powder paste with tamarind', 'Combine all and simmer', 'Add coconut-based tadka'], 'sambar recipe', 8, 22, 3, 6),

('Moong Dal', 'Moong Dal', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Easy Digestion', 'Light'], '25 min', 160, 'Light and easy to digest yellow lentils. Perfect for when you want something simple.', 'Khichdi or Rice', ARRAY['Wash moong dal thoroughly', 'Pressure cook with turmeric', 'Prepare simple cumin tadka', 'Pour tadka over dal', 'Serve hot with lemon'], 'moong dal tadka', 11, 24, 2, 7),

-- Paneer Recipes
('Palak Paneer', 'Paneer', 'veg', ARRAY['lunch', 'dinner'], ARRAY['Punjabi', 'North Indian'], ARRAY['Dairy'], ARRAY[]::TEXT[], ARRAY['High Protein', 'Iron Rich'], '35 min', 290, 'Cottage cheese cubes in vibrant spinach gravy. Iron-packed and delicious.', 'Butter Naan + Raita', ARRAY['Blanch and puree spinach', 'Saute onion, ginger, garlic', 'Add spinach puree and spices', 'Add paneer cubes', 'Finish with cream'], 'palak paneer recipe', 18, 12, 20, 4),

('Paneer Butter Masala', 'Paneer', 'veg', ARRAY['lunch', 'dinner'], ARRAY['Punjabi', 'North Indian'], ARRAY['Dairy', 'Nuts'], ARRAY[]::TEXT[], ARRAY['High Protein'], '40 min', 380, 'Rich tomato-cashew gravy with soft paneer. The crowd favorite.', 'Butter Naan + Jeera Rice', ARRAY['Blend tomatoes, cashews, ginger', 'Cook gravy with butter and cream', 'Add spices and kasuri methi', 'Add paneer cubes', 'Simmer and serve'], 'paneer butter masala', 16, 18, 28, 2),

('Kadai Paneer', 'Paneer', 'veg', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY['Dairy'], ARRAY[]::TEXT[], ARRAY['High Protein'], '30 min', 320, 'Paneer with bell peppers in kadai masala. Smoky and spicy.', 'Roti + Dal', ARRAY['Dry roast coriander and red chilies', 'Crush to make kadai masala', 'Saute onion, tomato, capsicum', 'Add paneer and kadai masala', 'Cook with minimal gravy'], 'kadai paneer recipe', 17, 14, 24, 3),

('Shahi Paneer', 'Paneer', 'veg', ARRAY['dinner'], ARRAY['Mughlai', 'North Indian'], ARRAY['Dairy', 'Nuts'], ARRAY[]::TEXT[], ARRAY['High Protein'], '45 min', 400, 'Royal paneer curry with nuts and saffron. Festive and indulgent.', 'Pulao + Salad', ARRAY['Soak saffron in warm milk', 'Make paste of cashews and melon seeds', 'Prepare rich onion-tomato gravy', 'Add nut paste, cream, saffron', 'Add paneer and simmer gently'], 'shahi paneer recipe', 15, 20, 30, 2),

('Matar Paneer', 'Paneer', 'veg', ARRAY['lunch', 'dinner'], ARRAY['North Indian', 'Punjabi'], ARRAY['Dairy'], ARRAY[]::TEXT[], ARRAY['High Protein', 'Fiber Rich'], '35 min', 300, 'Cottage cheese and green peas in tomato gravy. Homestyle comfort.', 'Roti + Rice', ARRAY['Prepare onion-tomato masala', 'Add green peas and cook', 'Add spices and water for gravy', 'Add paneer cubes', 'Garnish with cream'], 'matar paneer recipe', 16, 22, 18, 5),

-- Chicken Recipes
('Butter Chicken', 'Chicken', 'non-veg', ARRAY['dinner'], ARRAY['Punjabi', 'North Indian'], ARRAY['Dairy', 'Nuts'], ARRAY[]::TEXT[], ARRAY['High Protein'], '50 min', 450, 'Tandoori chicken in silky tomato-butter sauce. The iconic dish.', 'Butter Naan + Onion Rings', ARRAY['Marinate chicken in yogurt and spices', 'Grill or pan-fry chicken pieces', 'Make tomato-cashew gravy with butter', 'Add grilled chicken to gravy', 'Finish with cream and kasuri methi'], 'butter chicken recipe', 32, 15, 30, 2),

('Chicken Curry', 'Chicken', 'non-veg', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['High Protein'], '45 min', 350, 'Classic Indian chicken curry with aromatic spices. Everyday non-veg.', 'Rice + Roti', ARRAY['Marinate chicken with turmeric and salt', 'Saute onions until golden', 'Add ginger-garlic and tomatoes', 'Add chicken and cook covered', 'Finish with garam masala'], 'chicken curry recipe', 30, 10, 22, 2),

('Chicken Biryani', 'Chicken', 'non-veg', ARRAY['lunch', 'dinner'], ARRAY['Hyderabadi', 'Mughlai'], ARRAY['Dairy'], ARRAY[]::TEXT[], ARRAY['High Protein'], '90 min', 550, 'Layered rice and spiced chicken. The king of one-pot meals.', 'Raita + Mirchi Ka Salan', ARRAY['Marinate chicken with yogurt and biryani masala', 'Par-boil basmati rice with whole spices', 'Layer chicken and rice in heavy pot', 'Add saffron milk and fried onions', 'Dum cook on low heat'], 'chicken biryani recipe', 35, 60, 22, 3),

('Kadai Chicken', 'Chicken', 'non-veg', ARRAY['dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['High Protein'], '40 min', 380, 'Chicken with bell peppers in rustic kadai masala. Bold flavors.', 'Roti + Raita', ARRAY['Make kadai masala from coriander and dry chilies', 'Cook chicken pieces until browned', 'Add tomatoes and capsicum', 'Add kadai masala', 'Cook until thick gravy forms'], 'kadai chicken recipe', 28, 12, 24, 3),

('Chicken Tikka Masala', 'Chicken', 'non-veg', ARRAY['dinner'], ARRAY['Punjabi', 'North Indian'], ARRAY['Dairy'], ARRAY[]::TEXT[], ARRAY['High Protein'], '55 min', 420, 'Grilled tikka pieces in creamy spiced gravy. Global favorite.', 'Naan + Jeera Rice', ARRAY['Marinate chicken in tikka spices and yogurt', 'Grill or bake chicken pieces', 'Make onion-tomato based creamy gravy', 'Add grilled tikka to gravy', 'Simmer with cream'], 'chicken tikka masala', 34, 14, 26, 2),

-- Egg Recipes
('Egg Curry', 'Egg', 'non-veg', ARRAY['lunch', 'dinner'], ARRAY['North Indian', 'Bengali'], ARRAY['Egg'], ARRAY[]::TEXT[], ARRAY['High Protein'], '30 min', 280, 'Boiled eggs in onion-tomato gravy. Quick protein fix.', 'Rice + Roti', ARRAY['Hard boil and peel eggs', 'Fry eggs lightly until golden', 'Make onion-tomato masala gravy', 'Add eggs to gravy', 'Simmer with garam masala'], 'egg curry recipe', 14, 12, 18, 2),

('Egg Bhurji', 'Egg', 'non-veg', ARRAY['breakfast', 'dinner'], ARRAY['North Indian', 'Street Food'], ARRAY['Egg'], ARRAY[]::TEXT[], ARRAY['High Protein', 'Quick'], '15 min', 220, 'Indian style scrambled eggs with onions and spices. Perfect with pav.', 'Pav + Chai', ARRAY['Saute onions, tomatoes, green chilies', 'Add turmeric and red chili powder', 'Crack eggs directly into pan', 'Scramble while cooking', 'Garnish with coriander'], 'egg bhurji recipe', 13, 6, 16, 1),

('Anda Biryani', 'Egg', 'non-veg', ARRAY['lunch', 'dinner'], ARRAY['Hyderabadi'], ARRAY['Egg', 'Dairy'], ARRAY[]::TEXT[], ARRAY['High Protein'], '60 min', 480, 'Fragrant rice layered with spiced eggs. Vegetarian-friendly biryani option.', 'Raita + Salan', ARRAY['Hard boil eggs and fry until golden', 'Prepare biryani masala gravy', 'Par-boil basmati rice', 'Layer eggs, gravy and rice', 'Dum cook until done'], 'egg biryani recipe', 18, 55, 20, 2),

-- Vegetable Mains
('Aloo Gobi', 'Potato', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['North Indian', 'Punjabi'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Comfort Food'], '35 min', 200, 'Potato and cauliflower dry curry. Simple and satisfying.', 'Roti + Dal + Raita', ARRAY['Cut potato and cauliflower into florets', 'Saute with cumin and turmeric', 'Add ginger and green chilies', 'Cover and cook until tender', 'Finish with garam masala and coriander'], 'aloo gobi recipe', 5, 32, 6, 5),

('Baingan Bharta', 'Brinjal', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['Punjabi', 'North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Low Calorie'], '40 min', 150, 'Smoky mashed eggplant with spices. Fire-roasted goodness.', 'Roti + Dal', ARRAY['Roast whole brinjal over flame', 'Peel and mash the flesh', 'Saute onion, tomato, green chili', 'Add mashed brinjal', 'Season and cook until dry'], 'baingan bharta recipe', 4, 18, 5, 6),

('Bhindi Masala', 'Bhindi', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Low Calorie', 'High Fiber'], '25 min', 120, 'Crispy okra with onions and spices. No slime technique.', 'Roti + Dal', ARRAY['Wash and completely dry bhindi', 'Cut into pieces and fry until crisp', 'Saute onions separately', 'Add bhindi with spices', 'Toss and serve dry'], 'bhindi masala recipe', 3, 14, 6, 4),

('Jeera Aloo', 'Potato', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Comfort Food', 'Quick'], '20 min', 180, 'Cumin-tempered potatoes. The simplest side dish.', 'Puri + Curd', ARRAY['Boil and cube potatoes', 'Heat oil, add cumin seeds', 'Add potatoes with turmeric and chili', 'Toss until lightly crispy', 'Finish with coriander and amchur'], 'jeera aloo recipe', 3, 30, 5, 3),

('Palak Aloo', 'Potato', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Iron Rich'], '30 min', 190, 'Spinach and potato curry. Iron meets comfort.', 'Roti + Raita', ARRAY['Blanch and puree spinach', 'Cube and fry potatoes', 'Saute garlic and cumin', 'Add spinach puree and potatoes', 'Season and cook together'], 'palak aloo recipe', 5, 28, 6, 5),

('Mixed Veg', 'Mixed Vegetables', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['High Fiber', 'Balanced'], '35 min', 170, 'Assorted vegetables in light gravy. Use what you have.', 'Roti + Rice', ARRAY['Chop all vegetables uniformly', 'Saute onion-tomato base', 'Add vegetables with water', 'Season with garam masala', 'Cook until tender'], 'mixed veg curry recipe', 5, 24, 5, 6),

-- Rice Dishes
('Veg Pulao', 'Rice', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Balanced'], '30 min', 280, 'Fragrant rice with vegetables. One-pot weeknight meal.', 'Raita + Papad', ARRAY['Saute whole spices in ghee', 'Add vegetables and rice', 'Add water and salt', 'Cook covered until done', 'Fluff with fork and serve'], 'veg pulao recipe', 6, 50, 5, 3),

('Jeera Rice', 'Rice', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Light'], '20 min', 220, 'Cumin-flavored basmati rice. Perfect accompaniment.', 'Any curry', ARRAY['Wash and soak rice', 'Temper cumin in ghee', 'Add rice and water', 'Cook until fluffy', 'Garnish with fried cumin'], 'jeera rice recipe', 4, 45, 3, 1),

('Lemon Rice', 'Rice', 'vegan', ARRAY['lunch'], ARRAY['South Indian'], ARRAY['Nuts'], ARRAY[]::TEXT[], ARRAY['Light', 'Tangy'], '25 min', 250, 'Tangy rice with peanuts and curry leaves. South Indian favorite.', 'Papad + Pickle', ARRAY['Cook and cool rice', 'Make tempering with mustard, chana dal, peanuts', 'Add turmeric and curry leaves', 'Mix with rice and lemon juice', 'Serve at room temperature'], 'lemon rice recipe', 6, 48, 6, 2),

('Curd Rice', 'Rice', 'veg', ARRAY['lunch'], ARRAY['South Indian'], ARRAY['Dairy'], ARRAY[]::TEXT[], ARRAY['Cooling', 'Probiotic'], '15 min', 200, 'Cooling yogurt rice. Summer essential and comfort food.', 'Pickle + Papad', ARRAY['Cook and cool rice completely', 'Mix with fresh curd and milk', 'Temper with mustard, curry leaves, ginger', 'Add pomegranate or grapes optionally', 'Serve chilled'], 'curd rice recipe', 6, 38, 4, 1),

-- South Indian
('Masala Dosa', 'Rice', 'vegan', ARRAY['breakfast', 'lunch'], ARRAY['South Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Fermented', 'Probiotic'], '45 min', 300, 'Crispy crepe with spiced potato filling. Iconic breakfast.', 'Sambar + Coconut Chutney', ARRAY['Prepare dosa batter (fermented)', 'Make potato masala filling', 'Spread batter thin on hot tawa', 'Add potato filling and fold', 'Serve with chutneys and sambar'], 'masala dosa recipe', 7, 52, 8, 4),

('Idli', 'Rice', 'vegan', ARRAY['breakfast'], ARRAY['South Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Fermented', 'Light', 'Steamed'], '30 min', 150, 'Steamed rice cakes. Healthy fermented breakfast.', 'Sambar + Chutney', ARRAY['Prepare idli batter (rice and urad dal)', 'Ferment overnight', 'Pour into idli molds', 'Steam for 10-12 minutes', 'Serve hot with accompaniments'], 'idli recipe', 4, 28, 1, 2),

('Uttapam', 'Rice', 'vegan', ARRAY['breakfast', 'lunch'], ARRAY['South Indian'], ARRAY[]::TEXT[], ARRAY['Onion'], ARRAY['Fermented'], '25 min', 200, 'Thick pancake with vegetable toppings. Dosa batter, different style.', 'Sambar + Chutney', ARRAY['Use regular dosa batter', 'Pour thick layer on tawa', 'Add onion, tomato, chili toppings', 'Cook covered on low heat', 'Flip and cook other side'], 'uttapam recipe', 5, 36, 4, 3),

('Upma', 'Rava', 'veg', ARRAY['breakfast'], ARRAY['South Indian'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Quick', 'Light'], '20 min', 220, 'Semolina porridge with vegetables. Quick savory breakfast.', 'Coconut Chutney + Pickle', ARRAY['Dry roast rava until fragrant', 'Saute mustard, curry leaves, onion, vegetables', 'Add water and salt', 'Add rava and stir continuously', 'Cook until thick and fluffy'], 'upma recipe', 5, 38, 6, 2),

('Pongal', 'Rice', 'veg', ARRAY['breakfast'], ARRAY['South Indian'], ARRAY['Dairy'], ARRAY[]::TEXT[], ARRAY['Comfort Food'], '35 min', 280, 'Rice and moong dal porridge with pepper and ghee. Temple prasadam style.', 'Sambar + Coconut Chutney', ARRAY['Cook rice and moong dal together until mushy', 'Temper with ghee, pepper, cumin, cashews', 'Add curry leaves and ginger', 'Mix tempering into pongal', 'Serve hot with ghee on top'], 'ven pongal recipe', 8, 45, 10, 3),

-- Breads
('Roti', 'Wheat Flour', 'vegan', ARRAY['lunch', 'dinner'], ARRAY['North Indian'], ARRAY['Gluten'], ARRAY[]::TEXT[], ARRAY['Whole Grain'], '20 min', 120, 'Whole wheat flatbread. Daily bread of India.', 'Any curry', ARRAY['Knead soft dough with wheat flour', 'Rest for 15 minutes', 'Roll into thin circles', 'Cook on hot tawa, puff on flame', 'Apply ghee and serve'], 'roti recipe', 4, 24, 1, 3),

('Paratha', 'Wheat Flour', 'veg', ARRAY['breakfast', 'lunch', 'dinner'], ARRAY['North Indian', 'Punjabi'], ARRAY['Gluten', 'Dairy'], ARRAY[]::TEXT[], ARRAY['Energy Dense'], '25 min', 200, 'Layered flatbread with ghee. Flaky and satisfying.', 'Pickle + Curd + Butter', ARRAY['Make soft dough', 'Roll, apply ghee, fold into layers', 'Roll again into circle', 'Cook on tawa with ghee', 'Serve hot'], 'plain paratha recipe', 5, 30, 8, 2),

('Aloo Paratha', 'Wheat Flour', 'veg', ARRAY['breakfast', 'lunch'], ARRAY['Punjabi', 'North Indian'], ARRAY['Gluten', 'Dairy'], ARRAY[]::TEXT[], ARRAY['Filling'], '35 min', 280, 'Potato-stuffed flatbread. Punjabi breakfast champion.', 'Butter + Pickle + Curd', ARRAY['Make spiced mashed potato filling', 'Prepare wheat flour dough', 'Stuff dough balls with potato', 'Roll carefully and cook with ghee', 'Serve with white butter'], 'aloo paratha recipe', 6, 40, 12, 3),

('Puri', 'Wheat Flour', 'vegan', ARRAY['breakfast', 'lunch'], ARRAY['North Indian'], ARRAY['Gluten'], ARRAY[]::TEXT[], ARRAY['Festive'], '25 min', 150, 'Deep-fried puffed bread. Festive and indulgent.', 'Aloo Sabzi + Halwa', ARRAY['Make stiff dough with wheat flour', 'Roll into small circles', 'Deep fry in hot oil', 'Puri should puff up completely', 'Serve immediately while hot'], 'puri recipe', 3, 22, 7, 2),

('Naan', 'Maida', 'veg', ARRAY['dinner'], ARRAY['Mughlai', 'Punjabi'], ARRAY['Gluten', 'Dairy'], ARRAY[]::TEXT[], ARRAY['Restaurant Style'], '40 min', 180, 'Leavened tandoor bread. Restaurant favorite at home.', 'Any gravy curry', ARRAY['Make dough with yeast and yogurt', 'Let it rise for 2 hours', 'Shape into oval naans', 'Cook in very hot pan or tandoor', 'Brush with butter and garlic'], 'butter naan recipe', 5, 32, 5, 1),

-- Snacks & Street Food
('Samosa', 'Potato', 'vegan', ARRAY['snack'], ARRAY['North Indian', 'Street Food'], ARRAY['Gluten'], ARRAY[]::TEXT[], ARRAY['Crispy'], '45 min', 250, 'Crispy pastry with spiced potato filling. The ultimate Indian snack.', 'Green Chutney + Tamarind Chutney', ARRAY['Make crispy pastry dough', 'Prepare spiced potato-pea filling', 'Shape into triangular cones', 'Fill and seal properly', 'Deep fry until golden'], 'samosa recipe', 5, 35, 12, 3),

('Pakora', 'Besan', 'vegan', ARRAY['snack'], ARRAY['North Indian', 'Street Food'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Crispy', 'Rainy Day'], '20 min', 200, 'Vegetable fritters in gram flour batter. Monsoon essential.', 'Green Chutney + Chai', ARRAY['Make thick besan batter with spices', 'Slice onions, potatoes, spinach', 'Dip vegetables in batter', 'Deep fry in batches', 'Serve hot and crispy'], 'pakora recipe', 6, 25, 10, 3),

('Pav Bhaji', 'Mixed Vegetables', 'veg', ARRAY['dinner', 'snack'], ARRAY['Street Food', 'Maharashtrian'], ARRAY['Gluten', 'Dairy'], ARRAY[]::TEXT[], ARRAY['Street Food'], '40 min', 380, 'Spiced mashed vegetables with buttered bread. Mumbai street legend.', 'Extra Butter + Onion', ARRAY['Boil and mash vegetables together', 'Cook with pav bhaji masala and butter', 'Mash continuously while cooking', 'Toast pav with butter', 'Serve bhaji topped with butter'], 'pav bhaji recipe', 10, 52, 16, 6),

('Chole Bhature', 'Chole', 'veg', ARRAY['breakfast', 'lunch'], ARRAY['Punjabi', 'North Indian'], ARRAY['Gluten', 'Dairy'], ARRAY['Onion', 'Garlic'], ARRAY['High Protein'], '60 min', 550, 'Spiced chickpeas with fried bread. Punjabi feast.', 'Pickle + Onion + Lassi', ARRAY['Soak and pressure cook chickpeas', 'Make rich onion-tomato chole gravy', 'Prepare bhatura dough with yogurt', 'Roll and deep fry bhaturas', 'Serve together with pickle and onion'], 'chole bhature recipe', 18, 70, 22, 12),

('Vada Pav', 'Potato', 'vegan', ARRAY['snack', 'breakfast'], ARRAY['Street Food', 'Maharashtrian'], ARRAY['Gluten'], ARRAY[]::TEXT[], ARRAY['Street Food', 'Quick'], '30 min', 300, 'Spiced potato fritter in bread. Mumbai''s burger.', 'Dry Garlic Chutney + Fried Chili', ARRAY['Make spiced potato filling', 'Dip in besan batter', 'Deep fry until crispy', 'Slit pav and add chutneys', 'Place vada and serve'], 'vada pav recipe', 6, 45, 12, 4),

-- Sweets
('Kheer', 'Rice', 'veg', ARRAY['dessert'], ARRAY['North Indian'], ARRAY['Dairy', 'Nuts'], ARRAY[]::TEXT[], ARRAY['Festive', 'Sweet'], '45 min', 280, 'Rice pudding with cardamom and nuts. Festive essential.', 'After meals', ARRAY['Wash and soak rice', 'Boil milk and add rice', 'Cook on low heat stirring often', 'Add sugar, cardamom, saffron', 'Garnish with nuts and serve'], 'kheer recipe', 6, 45, 10, 1),

('Gajar Halwa', 'Carrot', 'veg', ARRAY['dessert'], ARRAY['North Indian', 'Punjabi'], ARRAY['Dairy', 'Nuts'], ARRAY[]::TEXT[], ARRAY['Winter Special'], '60 min', 350, 'Carrot pudding with khoya. Winter warmer.', 'After meals', ARRAY['Grate fresh red carrots', 'Cook in milk until milk evaporates', 'Add ghee and cook further', 'Add sugar and khoya', 'Garnish with nuts'], 'gajar halwa recipe', 5, 50, 16, 3),

('Gulab Jamun', 'Khoya', 'veg', ARRAY['dessert'], ARRAY['North Indian', 'Mughlai'], ARRAY['Dairy'], ARRAY[]::TEXT[], ARRAY['Festive'], '45 min', 300, 'Fried milk dumplings in sugar syrup. Celebration sweet.', 'After meals', ARRAY['Make dough from khoya and maida', 'Shape into smooth balls', 'Prepare sugar syrup with cardamom', 'Fry balls on low heat until brown', 'Soak in warm syrup'], 'gulab jamun recipe', 4, 52, 12, 0)

ON CONFLICT DO NOTHING;
