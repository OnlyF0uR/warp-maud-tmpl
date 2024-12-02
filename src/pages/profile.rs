use maud::{html, Markup, DOCTYPE};

pub fn render(profile_handle: &str) -> Markup {
    html! {
        (DOCTYPE)
        html {
            head {
                title { (format!("Profile: {}", profile_handle)) }
                script defer src="/static/router.js" {}
            }
            body {
                div id="app" {
                    h1 { "Profile of " (profile_handle) }
                    a href="/" { "Home" }
                    a href="/about" { "About Us" }
                }
            }
        }
    }
}
