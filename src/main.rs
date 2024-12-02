use pages::{about, profile, root};
use warp::Filter;

pub mod pages;

#[tokio::main]
async fn main() {
    // Serve static files (like router.js)
    let static_files = warp::path("static").and(warp::fs::dir("./static"));

    // Define routes
    let home_route = warp::path::end().map(|| warp::reply::html(root::render().into_string()));
    let about_route = warp::path("about").map(|| warp::reply::html(about::render().into_string()));
    let profile_route = warp::path!(String).map(|profile_handle: String| {
        warp::reply::html(profile::render(&profile_handle).into_string())
    });

    // Combine routes
    let routes = warp::get().and(
        home_route
            .or(about_route)
            .or(profile_route)
            .or(static_files),
    );

    // Start server
    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}
