// Import required modules
const express = require("express");
const { VercelRequest, VercelResponse } = require('@vercel/node');

// Initialize Express app
const app = express();

// Define middleware to handle JSON bodies
app.use(express.json());

// Define the handler function
function handler(req, res) {
    const { name = 'World' } = req.query;
    return res.json({
        message: `Hello ${name}!`,
    });
}

// Define a route to handle the processing of data
app.post("/process-data", async (req, res) => {
    try {
        // Your existing code for processing data goes here...

        const folderPath = 'dining_halls';
        const outputFolder = 'parsed_results_json';

        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder);
        }

        function clearOutputFolder(directory) {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    console.error(`Error reading the directory ${directory}:`, err);
                    return;
                }
        
                for (const file of files) {
                    fs.unlink(path.join(directory, file), err => {
                        if (err) {
                            console.error(`Error deleting file ${file}:`, err);
                        } else {
                            console.log(`Deleted ${file}`);
                        }
                    });
                }
            });
        }
        
        async function deleteIfColumnNotNull(tableName, columnName) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .delete()
                    .not(columnName, 'is', null);
    
                if (error) {
                    throw error;
                }
                console.log(`Rows where "${columnName}" is not null deleted successfully:`, data);
            } catch(error) {
                console.error('Error deleting rows:', error.message);
            }
        }
    
        async function pushToSupabase(foodItem, diningHall) {
            let name = foodItem.food_name;
            let meal_time = foodItem.meal_time;
            let allergens = foodItem.allergens;
            let traits = foodItem.traits;
            let nutrition_facts = foodItem.nutrition_facts;
            let is_breakfast = false;
            let is_lunch = false;
            let is_dinner = false;
            let is_brunch = false;
    
            //for loop to go through each meal time in the meal
            for (const meal_time of foodItem.meal_time) {
                if (meal_time === 'breakfast') {
                    is_breakfast = true;
                }
                else if (meal_time === 'lunch') {
                    is_lunch = true;
                }
                else if (meal_time === 'dinner') {
                    is_dinner = true;
                }
                else if (meal_time === 'brunch') {
                    is_brunch = true;
                }
            }
    
            
            try {
                const { data, error } = await supabase.from(diningHall).upsert({ name, meal_time, allergens, traits, nutrition_facts, is_breakfast, is_lunch, is_dinner, is_brunch });
                if (error) {
                    console.error("Error", error.message);
                } else {
                    console.log("Success", data);
                }
                } catch (error) {
                    console.error("Caught Error", error.message);
            }
        }
        
        async function parseHTMLFilesInFolder(folderPath) {
            await deleteIfColumnNotNull('Bursley', 'name');
            await deleteIfColumnNotNull('Markley', 'name');
            await deleteIfColumnNotNull('North Quad', 'name');
            await deleteIfColumnNotNull('South Quad', 'name');
            await deleteIfColumnNotNull('East Quad', 'name');
            await deleteIfColumnNotNull('Mosher-Jordan', 'name');
            await deleteIfColumnNotNull('Twigs at Oxford', 'name');
        
            const files = fs.readdirSync(folderPath);
            
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const data = fs.readFileSync(filePath, 'utf8');
        
                const $ = cheerio.load(data);
                const diningHallName = $('a.level_2.active').text().trim();
                const diningHallFilePath = path.join(__dirname, outputFolder, `${diningHallName}.json`);
        
                let diningHallFoods = new Map();
                let jsonArray = [];
        
                $('h3 > a').each((index, element) => {
                    const mealTime = $(element).text().trim().toLowerCase();
                    $(element).parent().next().find('li').each((foodIndex, foodElement) => {
                        $(foodElement).data('meal-time', mealTime);
                    });
                });        
                
                const pushToDiningHallFoods = () => {
                    for (const element of $('ul.items > li')) {
                        let foodItem = {}
                        foodItem.food_name = $(element).find('.item-name').text().trim();
        
                        let meal_time = [$(element).data('meal-time')]
                        foodItem.meal_time = meal_time
        
                        foodItem.allergens = $(element).find('.allergens ul li').map((idx, allergen) => $(allergen).text().trim()).get()
                        foodItem.traits = $(element).find('.traits li').map((idx, trait) => $(trait).text().trim()).get()
                        
                        let nutritionFacts = {};
                        $(element).find('.nutrition-facts tbody tr').each((idx, tr) => {
                            let label = $(tr).find('td').first().text().trim().replace(':', '').replace(/(\r\n|\n|\r)/gm, "").trim();
                            let value = $(tr).find('td').last().text().trim().replace(/(\r\n|\n|\r)/gm, "").trim();
        
                            const subLabel = label.substring(0, label.indexOf(" "));
                            if (subLabel === 'Serving') {
                                const startIndex = label.indexOf('Size') + 'Size'.length;
                                const subString = label.substring(startIndex).trim();
        
                                let adjust = subString.match(/\((.*?)\)/); // Match content within parentheses
                                if (adjust && adjust.length > 1) { // Check if there's a match and captured group
                                    adjust = adjust[1]; // Access captured group
                                    adjust = adjust.replace(/[^\d.]/g, ''); // Remove non-digit characters
                                    nutritionFacts['serving_size'] = adjust;
                                }
                            } 
                            
                            else if (subLabel === 'Calories') {
                                const startIndex = label.indexOf('Calories') + 'Calories'.length;
                                const subString = label.substring(startIndex).trim();
                                nutritionFacts['calories'] = subString.replace(/[^\d.]/g, '');
                            } 
                            
                            else if (subLabel === 'Sugars') {
                                const startIndex = label.indexOf('Sugars') + 'Sugars'.length;
                                const subString = label.substring(startIndex).trim();
                                nutritionFacts['sugars'] = subString.replace(/[^\d.]/g, '');
                            } 
                            
                            else if (subLabel === 'Protein') {
                                const startIndex = label.indexOf('Protein') + 'Protein'.length;
                                const subString = label.substring(startIndex).trim();
                                nutritionFacts['protein'] = subString.replace(/[^\d.]/g, '');
                            } 
                            
                            else if (subLabel === 'Sodium') {
                                const startIndex = label.indexOf('Sodium') + 'Sodium'.length;
                                const subString = label.substring(startIndex).trim();
                                nutritionFacts['sodium'] = subString.replace(/[^\d.]/g, '');
                            } 
                            
                            else if (subLabel === 'Cholesterol') {
                                const startIndex = label.indexOf('Cholesterol') + 'Cholesterol'.length;
                                const subString = label.substring(startIndex).trim();
                                nutritionFacts['cholesterol'] = subString.replace(/[^\d.]/g, '');
                            } 
                            
                            else if (subLabel === 'Total') { 
                                if (label.includes('Total Fat')) {
                                    const startIndex = label.indexOf('Total Fat') + 'Total Fat'.length;
                                    const subString = label.substring(startIndex).trim();
                                    nutritionFacts['total_fat'] = subString.replace(/[^\d.]/g, '');
                                } else if (label.includes('Total Carbohydrate')) {
                                    const startIndex = label.indexOf('Total Carbohydrate') + 'Total Carbohydrate'.length;
                                    const subString = label.substring(startIndex).trim();
                                    nutritionFacts['total_carbohydrate'] = subString.replace(/[^\d.]/g, '');
                                }
                            } 
                            
                            else if (subLabel === 'Saturated') { // 
                                const startIndex = label.indexOf('Saturated Fat') + 'Saturated Fat'.length;
                                const subString = label.substring(startIndex).trim();
                                nutritionFacts['saturated_fat'] = subString.replace(/[^\d.]/g, '');
                            } 
                            
                            else if (subLabel === 'Dietary') { //
                                const startIndex = label.indexOf('Dietary Fiber') + 'Dietary Fiber'.length;
                                const subString = label.substring(startIndex).trim();
                                nutritionFacts['dietary_fiber'] = subString.replace(/[^\d.]/g, '');
                            } 
        
                            else if (label === 'Iron') {
                                nutritionFacts['iron'] = value.replace(/[^\d.]/g, '');
                            }
        
                            else if (label === 'Calcium') {
                                nutritionFacts['calcium'] = value.replace(/[^\d.]/g, '');
                            }
        
                            else if (subLabel === 'Vitamin') { 
                                if (label.includes('Vitamin A')) {
                                    nutritionFacts['vitamin_a'] = value.replace(/[^\d.]/g, '');
                                } else if (label.includes('Vitamin C')) {
                                    nutritionFacts['vitamin_c'] = value.replace(/[^\d.]/g, '');
                                }
                            } 
                            
                            else if (label && value && label != 'Amount Per Serving') {
                                nutritionFacts[label] = value.replace(/[^\d.]/g, '');
                            }
                        });
                        foodItem.nutrition_facts = nutritionFacts;
        
                        if(diningHallFoods.get(foodItem.food_name)){
                            if(!diningHallFoods.get(foodItem.food_name).meal_time.includes($(element).data('meal-time'))){
                                diningHallFoods.get(foodItem.food_name).meal_time.push($(element).data('meal-time'));
                            }
                        }
                        else{
                            diningHallFoods.set(foodItem.food_name, foodItem);
                        }
                        jsonArray.push([foodItem.food_name, foodItem.meal_time, foodItem.allergens, foodItem.traits, foodItem.nutrition_facts]);
                    };
                    // Save the JSON file after processing each HTML file
                    fs.writeFileSync(diningHallFilePath, JSON.stringify(jsonArray, null, 2), 'utf8');
                }
                pushToDiningHallFoods();
                for (const [foodName, foodItem] of diningHallFoods) {
                    await pushToSupabase(foodItem, diningHallName)
                }
            }
        }

        res.status(200).json({ message: "Data processed successfully." });
    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).json({ error: 'An error occurred while processing data.' });
    }
});

// Define the endpoint using the handler function
app.get("/api/data", handler);

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;