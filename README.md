AUTOFiT LIVE API READY

1. Upload all contents to the ROOT of a GitHub repository.
2. Connect the repository to Netlify.
3. Add Netlify environment variables:
   VEHICLE_API_URL
   VEHICLE_API_KEY
4. Choose an authorized vehicle-data provider and adjust its exact request/response mapping in netlify/functions/vehicle-lookup.mjs.
5. Replace sample records in data/fitments.json with the complete fitment database.

IMPORTANT: API keys must never be placed inside index.html.
