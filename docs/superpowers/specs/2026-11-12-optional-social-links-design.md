# Optional Social Links Design

## Goal

Give adopters an optional set of social links in the site footer without adding placeholder accounts or changing the deployed Like TAC site today.

## Approved behavior

- Supported services are YouTube, Twitch, X / Twitter, Instagram, and Discord.
- Each service is optional. A blank URL is not rendered.
- Links appear beside the footer brand area on wide screens, wrap when space is limited, and move below the brand on small screens.
- Link labels show the service name and the adopter-provided handle or community name.
- External social links open in a new tab with safe `rel` attributes.
- The Like TAC configuration remains empty by default. This makes the feature available in source without publishing new links on `liketac.live`.
- The adopter guide asks for each service separately and forbids invented placeholder handles or URLs.

## Architecture

Create a typed configuration module and a small `SocialLinks` presentational component. The root layout renders the component in a branded footer group. CSS owns wrapping and mobile stacking. Tests prove configured links render and blank or unsafe entries do not.

## Out of scope

- Deploying or changing the production Like TAC website.
- Creating social accounts for Like TAC or an adopter.
- Database-backed social-link editing.
