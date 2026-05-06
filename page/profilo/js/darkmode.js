let darkmode = localStorage.getItem('dark');
const switch_button = document.getElementById("theme_switch");

const enableDarkmode = () => {
    document.body.classList.add('dark');
    localStorage.setItem('dark' , 'active');
}

const disableDarkmode = () => {
    document.body.classList.remove('dark');
     localStorage.removeItem('dark'); 
};

if (darkmode === 'active') enableDarkmode();

switch_button.addEventListener("click", () => {
    darkmode = localStorage.getItem('dark');
    darkmode !== "active" ? enableDarkmode() : disableDarkmode();
});


