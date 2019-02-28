(function() {
  document.addEventListener("DOMContentLoaded", () => {
    const text = $(".subtitle").text();
    console.log("text");

    // var prevScrollpos = window.pageYOffset;
    // window.onscroll = function() {
    //   var currentScrollPos = window.pageYOffset;
    //   const header = document.querySelector(".header");
    //   if (window.pageYOffset > 50) {
    //     header.classList.add("h-colored");
    //   } else {
    //     header.classList.remove("h-colored");
    //   }
    //   if (prevScrollpos > currentScrollPos) {
    //     header.classList.remove("h-pullup");
    //   } else {
    //     header.classList.add("h-pullup");
    //   }
    //   prevScrollpos = currentScrollPos;
    // };
    // $(".hamburger").on("click", e => {
    //   $(e.currentTarget).toggleClass("is-active");
    //   $(".navigation ").fadeToggle(400, function() {
    //     if ($(this).css("display") === "none") {
    //       $(this).removeAttr("style");
    //     }
    //   });
    //   $("body").toggleClass("noScroll");
    // });
  });
})();
