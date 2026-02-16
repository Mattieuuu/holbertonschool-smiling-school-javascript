// Application initialization
const SmileSchoolApp = {
  init() {
    // Update current year in footer
    this.updateCurrentYear();
    
    // Initialize all carousel components
    this.setupTestimonialSlider();
    this.loadPopularContent();
    this.loadLatestContent();
    this.setupSearchFilters();
  },

  updateCurrentYear() {
    $(".js-current-year").text(new Date().getFullYear());
  }
};

// Wait for DOM to be fully loaded
$(function() {
  SmileSchoolApp.init();
});

// Testimonials carousel setup
SmileSchoolApp.setupTestimonialSlider = function() {
  const testimonialElements = {
    spinner: $("#quotes-loader"),
    container: $("#quotes-carousel"),
    slideWrapper: $("#quotes-carousel-inner")
  };

  // Exit if testimonial section doesn't exist
  if (!testimonialElements.slideWrapper.length) return;

  this.loadTestimonialData(testimonialElements);
};

// Load testimonial data from API
SmileSchoolApp.loadTestimonialData = function(elements) {
  const API_ENDPOINT = "https://smileschool-api.hbtn.info/quotes";
  
  $.get({
    url: API_ENDPOINT,
    dataType: "json",
    beforeSend: () => {
      this.toggleLoadingState(elements.spinner, elements.container, true);
    },
    success: (testimonialData) => {
      const carouselSlides = this.buildTestimonialSlides(testimonialData);
      elements.slideWrapper.html(carouselSlides);
      this.toggleLoadingState(elements.spinner, elements.container, false);
    },
    error: () => {
      this.handleTestimonialError(elements);
    }
  });
};

// Build HTML for testimonial slides
SmileSchoolApp.buildTestimonialSlides = function(testimonials) {
  return testimonials.map((testimonial, idx) => {
    const isActiveSlide = idx === 0 ? "active" : "";
    return `
      <div class="carousel-item ${isActiveSlide}">
        <div class="row align-items-center">
          <div class="col-12 col-md-3 text-center mb-3 mb-md-0">
            <img class="rounded-circle" src="${testimonial.pic_url}" 
                 alt="${testimonial.name}" width="140" height="140">
          </div>
          <div class="col-12 col-md-9">
            <p class="lead mb-3">${testimonial.text}</p>
            <p class="font-weight-bold mb-1">${testimonial.name}</p>
            <p class="font-italic mb-0">${testimonial.title}</p>
          </div>
        </div>
      </div>`;
  }).join("");
};

// Handle loading states for carousel
SmileSchoolApp.toggleLoadingState = function(spinner, container, isLoading) {
  if (isLoading) {
    spinner.removeClass("d-none");
    container.addClass("d-none");
  } else {
    spinner.addClass("d-none");
    container.removeClass("d-none");
  }
};

// Handle testimonial loading errors
SmileSchoolApp.handleTestimonialError = function(elements) {
  elements.spinner.addClass("d-none");
  elements.slideWrapper.html(
    '<div class="carousel-item active"><p class="text-center mb-0">Unable to load testimonials.</p></div>'
  );
  elements.container.removeClass("d-none");
};

// Popular content carousel setup
SmileSchoolApp.loadPopularContent = function() {
  this.createVideoCarousel({
    endpoint: "https://smileschool-api.hbtn.info/popular-tutorials",
    loaderId: "#popular-loader",
    carouselId: "#popular-carousel", 
    slidesId: "#popular-carousel-inner",
    responsiveConfig: this.getResponsiveCardCount
  });
};

// Latest videos carousel setup  
SmileSchoolApp.loadLatestContent = function() {
  this.createVideoCarousel({
    endpoint: "https://smileschool-api.hbtn.info/latest-videos",
    loaderId: "#latest-loader",
    carouselId: "#latest-carousel",
    slidesId: "#latest-carousel-inner", 
    responsiveConfig: this.getResponsiveCardCount
  });
};

// Get responsive card count based on screen width
SmileSchoolApp.getResponsiveCardCount = function(screenWidth) {
  if (screenWidth < 576) return 1;
  if (screenWidth < 768) return 2; 
  return 4;
};

// Generic video carousel creator
SmileSchoolApp.createVideoCarousel = function(config) {
  const carouselElements = {
    loader: $(config.loaderId),
    carousel: $(config.carouselId),
    slidesContainer: $(config.slidesId)
  };

  // Exit if carousel doesn't exist on page
  if (!carouselElements.slidesContainer.length) return;

  let videoData = [];
  let currentCardCount = 0;
  const self = this;

  function rebuildCarouselSlides(maintainPosition = false) {
    if (!videoData.length) return;

    const activeSlideIndex = maintainPosition ? 
      carouselElements.slidesContainer.find(".carousel-item.active").index() || 0 : 0;
    
    currentCardCount = config.responsiveConfig($(window).width());
    const carouselHTML = self.generateCarouselHTML(videoData, currentCardCount, activeSlideIndex);
    carouselElements.slidesContainer.html(carouselHTML);
  }

  this.fetchVideoData(config.endpoint, carouselElements, (data) => {
    videoData = data;
    rebuildCarouselSlides();
    
    // Responsive resize handler
    $(window).off('resize.videoCarousel').on('resize.videoCarousel', () => {
      const newCardCount = config.responsiveConfig($(window).width());
      if (newCardCount !== currentCardCount) {
        rebuildCarouselSlides(true);
      }
    });
  });
};

// Fetch video data from API
SmileSchoolApp.fetchVideoData = function(apiEndpoint, elements, onSuccess) {
  $.ajax({
    url: apiEndpoint,
    type: "GET",
    dataType: "json",
    beforeSend: () => {
      this.toggleLoadingState(elements.loader, elements.carousel, true);
    },
    success: (videoList) => {
      onSuccess(videoList);
      this.toggleLoadingState(elements.loader, elements.carousel, false);
    },
    error: () => {
      this.handleVideoLoadError(elements);
    }
  });
};

// Generate carousel HTML structure
SmileSchoolApp.generateCarouselHTML = function(videoItems, cardsPerSlide, activeIndex) {
  return videoItems.map((_, slideIndex) => {
    const isActiveSlide = slideIndex === activeIndex ? "active" : "";
    const slideCards = [];
    
    for (let cardOffset = 0; cardOffset < cardsPerSlide; cardOffset++) {
      const videoItem = videoItems[(slideIndex + cardOffset) % videoItems.length];
      slideCards.push(
        `<div class="col-12 col-sm-6 col-md-3 mb-3 mb-md-0">
           ${this.createVideoCard(videoItem)}
         </div>`
      );
    }
    
    return `
      <div class="carousel-item ${isActiveSlide}">
        <div class="row">
          ${slideCards.join("")}
        </div>
      </div>`;
  }).join("");
};

// Create individual video card HTML
SmileSchoolApp.createVideoCard = function(videoData) {
  const starRating = this.generateStarRating(videoData.star);
  
  return `
    <div class="card border-0 h-100">
      <div class="card-thumb-wrap">
        <img src="${videoData.thumb_url}" class="card-img-top" alt="${videoData.title}">
        <span class="play-btn d-flex align-items-center justify-content-center">▶</span>
      </div>
      <div class="card-body px-0">
        <h5 class="card-title mb-2">${videoData.title}</h5>
        <p class="card-text text-muted mb-3">${videoData["sub-title"]}</p>
        <div class="d-flex align-items-center mb-3">
          <img src="${videoData.author_pic_url}" alt="${videoData.author}" 
               class="rounded-circle mr-2" width="30" height="30">
          <span class="font-weight-bold text-primary">${videoData.author}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <div class="text-primary tutorial-stars">${starRating}</div>
          <small class="text-primary font-weight-bold">${videoData.duration}</small>
        </div>
      </div>
    </div>`;
};

// Generate star rating display
SmileSchoolApp.generateStarRating = function(rating) {
  const maxStars = 5;
  let starHTML = "";
  
  for (let i = 1; i <= maxStars; i++) {
    starHTML += i <= rating ? "★" : "☆";
  }
  
  return starHTML;
};

// Handle video loading errors
SmileSchoolApp.handleVideoLoadError = function(elements) {
  elements.loader.addClass("d-none");
  elements.slidesContainer.html(
    '<div class="carousel-item active"><p class="text-center mb-0">Unable to load content.</p></div>'
  );
  elements.carousel.removeClass("d-none");
};

// Course search and filter system
SmileSchoolApp.setupSearchFilters = function() {
  const filterElements = {
    searchInput: $("#courses-keywords"),
    topicSelect: $("#courses-topic"),
    sortSelect: $("#courses-sort"),
    loadingSpinner: $("#courses-loader"),
    resultsContainer: $("#courses-results"),
    videoCounter: $("#courses-count")
  };

  // Exit if courses page elements don't exist
  if (!filterElements.resultsContainer.length) return;

  const searchState = {
    isInitialized: false,
    searchTimeout: null
  };

  const self = this;

  // Format dropdown option labels
  function beautifyOptionText(rawValue) {
    return rawValue.replace(/_/g, " ")
                   .replace(/\b\w/g, l => l.toUpperCase());
  }

  // Update dropdown options with API data
  function updateSelectOptions(selectElement, optionsList, selectedValue) {
    const optionsHTML = optionsList.map(option => {
      const isSelected = option === selectedValue ? "selected" : "";
      return `<option value="${option}" ${isSelected}>${beautifyOptionText(option)}</option>`;
    }).join("");
    
    selectElement.html(optionsHTML);
  }

  // Render course cards in results container
  function displayCourseResults(courseList) {
    const courseCards = courseList.map(course => {
      return `<div class="col-12 col-sm-6 col-md-3 mb-4">
                ${self.createVideoCard(course)}
              </div>`;
    }).join("");
    
    filterElements.resultsContainer.html(courseCards);
  }

  // Main function to fetch and display courses
  function performCourseSearch() {
    const searchParams = {
      q: filterElements.searchInput.val(),
      topic: filterElements.topicSelect.val(),
      sort: filterElements.sortSelect.val()
    };

    $.ajax({
      url: "https://smileschool-api.hbtn.info/courses",
      method: "GET",
      dataType: "json",
      data: searchParams,
      beforeSend: () => {
        filterElements.loadingSpinner.removeClass("d-none");
      },
      success: (apiResponse) => {
        // Update filter dropdowns with fresh data
        updateSelectOptions(filterElements.topicSelect, apiResponse.topics, apiResponse.topic);
        updateSelectOptions(filterElements.sortSelect, apiResponse.sorts, apiResponse.sort);

        // Initialize search input with API value on first load
        if (!searchState.isInitialized) {
          filterElements.searchInput.val(apiResponse.q);
          searchState.isInitialized = true;
        }

        // Update results
        const videoCount = apiResponse.courses.length;
        filterElements.videoCounter.text(`${videoCount} video${videoCount !== 1 ? 's' : ''}`);
        displayCourseResults(apiResponse.courses);
        filterElements.loadingSpinner.addClass("d-none");
      },
      error: () => {
        self.handleSearchError(filterElements);
      }
    });
  }

  // Set up event listeners for filters
  filterElements.searchInput.on("input", () => {
    clearTimeout(searchState.searchTimeout);
    searchState.searchTimeout = setTimeout(performCourseSearch, 300);
  });

  filterElements.topicSelect.on("change", performCourseSearch);
  filterElements.sortSelect.on("change", performCourseSearch);

  // Initial load
  performCourseSearch();
};

// Handle course search errors
SmileSchoolApp.handleSearchError = function(elements) {
  elements.loadingSpinner.addClass("d-none");
  elements.videoCounter.text("0 videos");
  elements.resultsContainer.html(
    '<div class="col-12"><p class="mb-0">Unable to load courses at the moment.</p></div>'
  );
};
