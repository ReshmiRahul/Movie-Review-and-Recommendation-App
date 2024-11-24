// Import necessary modules
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

// Initialize express app
const app = express();

// Load environment variables from .env file
dotenv.config();

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', './views');

// Define the port
const PORT = process.env.PORT || 3000;

// Home route
app.get('/', (req, res) => {
    res.render('index');
});

// Search route (for movie search)
app.get('/search', async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.render('search', { movies: [] });
    }

    try {
        // Fetch search results from TMDb API
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${query}`);
        
        if (response.data.results.length === 0) {
            console.log('No movies found.');
        }

        const movies = response.data.results;
        res.render('search', { movies });
    } catch (error) {
        console.error('Error fetching search results:', error);
        res.render('search', { movies: [] });
    }
});


// Movie details route
app.get('/movie/:id', async (req, res) => {
    const movieId = req.params.id;

    try {
        console.log('Movie ID:', movieId); // Log movie ID to verify it's correct

        const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`);
        console.log('Movie Details:', response.data); // Log the response from TMDb API
        
        const movie = response.data;
        res.render('movie', { movie });
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).send('Internal Server Error');
    }
});


// OpenAI recommendation route (Generate personalized movie recommendations)
app.get('/recommendations', async (req, res) => {
    const userPreferences = req.query.preferences || 'action, adventure';

    try {
        // Fetch personalized recommendations from OpenAI API
        const openaiResponse = await axios.post('https://api.openai.com/v1/completions', {
            model: 'text-davinci-003',  // Use GPT-3 model for recommendations
            prompt: `Recommend movies based on the following preferences: ${userPreferences}.`,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const recommendations = openaiResponse.data.choices[0].text.trim();
        res.render('recommendations', { recommendations });
    } catch (error) {
        console.error('Error fetching movie recommendations:', error);
        res.status(500).send('Something went wrong');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
