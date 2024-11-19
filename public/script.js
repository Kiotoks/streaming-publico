// Function to open the modal for a specific gallery
function openModal(gallery) {
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modal-img");
    const caption = document.getElementById("caption");
    const closeModal = document.getElementById("close");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");

    let currentIndex = 0;

    // Get the images in this specific gallery
    const galleryItems = gallery.querySelectorAll(".gallery-item img");

    // Function to update modal content
    function updateModal(index) {
        const item = galleryItems[index];
        modalImg.src = item.src;
        caption.textContent = item.alt;
    }

    // Open modal when clicking an image
    galleryItems.forEach((item, index) => {
        item.addEventListener("click", () => {
            modal.style.display = "flex";
            currentIndex = index;
            updateModal(currentIndex);
        });
    });

    // Close modal
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Close modal when clicking outside the image
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    // Show previous image
    prevBtn.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        updateModal(currentIndex);
    });

    // Show next image
    nextBtn.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        updateModal(currentIndex);
    });

    document.addEventListener("keydown", (e) => {
        if (modal.style.display === "flex") {
            if (e.key === "ArrowLeft") {
                currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
                updateModal(currentIndex);
            } else if (e.key === "ArrowRight") {
                currentIndex = (currentIndex + 1) % galleryItems.length;
                updateModal(currentIndex);
            } else if (e.key === "Escape") {
                modal.style.display = "none";
            }
        }
    });
}

// Get all galleries
const galleries = document.querySelectorAll(".gallery");

// Attach modal functionality to each gallery
galleries.forEach((gallery) => {
    gallery.addEventListener("click", () => {
        openModal(gallery);
    });
});


// Get the gallery element



// Determine number of items

galleries.forEach(galeria => {
    const items = galeria.querySelectorAll(".gallery-item");
    const itemCount = items.length;

    // Add the appropriate class
    if (itemCount === 1) {
        galeria.classList.add("one-item");
    } else if (itemCount === 2) {
        galeria.classList.add("two-items");
    } else if (itemCount === 3) {
        galeria.classList.add("three-items");
    } else if (itemCount >= 4) {
        galeria.classList.add("four-items");
    } 
});
