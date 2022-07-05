(function() {
    var navTrigger = function() {
        document.querySelector('html').classList.toggle('nav-trigger');
    }
    document.getElementById('nav-btn').addEventListener('click', navTrigger);
})();

