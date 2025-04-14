
# Create Master User Function

This Edge Function creates a master user with all privileges in the system.

It handles:
- Checking if the master user already exists
- Creating the user in the Auth system
- Setting up their profile with the master role
- Adding all required permissions

## Environment Variables
- SUPABASE_URL: The URL of your Supabase project (automatically set)
- SUPABASE_SERVICE_ROLE_KEY: The service role key for your Supabase project (must be set manually)

## Usage
This function is called from the login page when clicking the "Create Master User" button.
