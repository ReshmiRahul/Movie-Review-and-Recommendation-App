require('dotenv').config(); 
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Set up the view engine to Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); 

// Serve static files like CSS, images, and JavaScript
app.use(express.static(path.join(__dirname, 'public')));

// Set up API keys from the environment variables
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Home Route: Fetch Popular Movies from TMDB API
app.get('/', async (req, res) => {
    try {
        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`);
        const movies = tmdbResponse.data.results;

        res.render('index', { movies });
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        res.status(500).send('Error fetching popular movies');
    }
});

// Movie Details Route
app.get('/movie/:id', async (req, res) => {
    const movieId = req.params.id;

    try {
        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        const tmdbMovie = tmdbResponse.data;

        // Fetch IMDb ID from TMDB data
        const imdbId = tmdbMovie.imdb_id;

        if (!imdbId) {
            return res.status(404).send('IMDb ID not found for this movie');
        }

        const omdbResponse = await axios.get(`http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`);
        const movieDetails = omdbResponse.data;

        if (movieDetails.Response === 'True') {
            // Render the movie details page
            res.render('movie-details', { movie: movieDetails });
        } else {
            res.status(404).send('Movie not found');
        }
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).send('Error fetching movie details');
    }
});

// Movie Search Route
app.get('/search', async (req, res) => {
    const query = req.query.q; 
    try {
        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`);
        const movies = tmdbResponse.data.results;

        // Render the search results in the 'index.pug' view
        res.render('index', { movies });
    } catch (error) {
        console.error('Error fetching search results:', error);
        res.status(500).send('Error fetching search results');
    }
});

app.get('/recommendations', async (req, res) => {
    console.log('Fetching movie recommendations...');
    
    try {
        const openaiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo', 
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Suggest a list of popular movies for this year.' }
                ],
                max_tokens: 150,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Check if OpenAI response has the expected structure
        if (openaiResponse.data && openaiResponse.data.choices && openaiResponse.data.choices.length > 0) {
            const movieRecommendations = openaiResponse.data.choices[0].message.content.trim();
            res.render('recommendations', { recommendations: movieRecommendations });
        } else {
            console.error('No recommendations found in OpenAI response');
            res.status(500).send('Error fetching movie recommendations');
        }

    } catch (error) {
        // Detailed error logging
        if (error.response) {
            console.error('OpenAI API response error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        res.status(500).send('Error fetching movie recommendations');
    }
});



// Listen on port 3000 
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
