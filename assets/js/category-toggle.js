document.addEventListener("DOMContentLoaded", function () {
    // 选择每个分类标题
    document.querySelectorAll(".taxonomy__section .archive__subtitle").forEach(function (el) {
      let entriesList = el.nextElementSibling; // 下一层是 div.entries-list
      if (entriesList && entriesList.classList.contains("entries-list")) {
        entriesList.classList.add("collapsed"); // 默认折叠
      }
  
      el.style.cursor = "pointer"; // 鼠标手势
  
      el.addEventListener("click", function () {
        if (entriesList) {
          entriesList.classList.toggle("collapsed");
        }
        el.classList.toggle("open");
      });
    });
  });
  