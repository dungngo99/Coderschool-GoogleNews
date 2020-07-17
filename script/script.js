/*
[ ] The user can see a list of the 20 latest top news stories, loaded dynamically from our api
[ ] For each story, the user sees a headline, the source, a link to more, and an image
[ ] The user can see the total number of stories currently shown
[ ] The user can click a link at the bottom of the page to load the next 20 stories. The page should not refresh; the stories should simply be added to the bottom
[ ] The user can see how long ago the story was published in a human-friendly format; e.g. "15 minutes ago". To accomplish this, we recommend you use momentjs. Please load it into your page using cdnjs or jsdelivr (these are called CDNs)

[ ] Next to the source name, the user sees a number representing the number of stories from that source. To continue the previous example: bbc-news (2), cnn (1), spiegel-de (1).
[ ] The user can toggle the checkbox to hide or show stories from that source in the list.
[ ] The user can see links or a dropdown that represent the various categories for stories. Selecting on one of these links fetches a new batch of stories of the selected category.
[ ] The user should see new stories related to the category she chose.
[ ] The user should see a new or modified URL, with a query parameter representing the chosen category. For example, clicking on entertainment would add ?category=entertainment to the URL. The page should not refresh. To do this, look at URLSearchParameters and PushState.
[ ] The user should be able to load a page with the appropriate query parameter and automatically have the appropriate stories shown.
*/
const apiKey = '6c4192e01b7f44d0a8fc4b6b05a3ea54'
const domain = 'https://newsapi.org/v2'
const endpoints = {
  'top-headlines': ['country', 'category', 'source', 'q', 'pageSize', 'page'],
  'sources': ['category', 'language', 'country'],
  'everything': ['q', 'domains', 'from', 'to', 'sortBy', 'pageSize', 'page'],
}
//Variables to store our database
let headlineHTML = []
let sourceHTML = {}
let everythingHTML = []

//Vairables for headline news
let page_HL = 1
let curPage_HL = 10
let totalPage_HL = 0
let myCategory = ''

//Variables for everything news
let page_E = 1
let curPage_E = 10
let totalPage_E = 0

document.getElementById('dn-search-btn').addEventListener('click', search())

document.getElementById('dn-showall').addEventListener('click', displaySource())

document.getElementById('dn-more-news').addEventListener('click', function () {
  if (curPage_HL >= totalPage_HL) {
    return
  } else if (curPage_HL < totalPage_HL && curPage_HL + 10 >= totalPage_HL) {
    //Update the number of page showed
    curPage_HL = totalPage_HL
  } else {
    //Update the number of page showed
    curPage_HL += 10
  }

  //Update the current batch and display HTML
  page_HL += 1
  displayHeadline(myCategory, page_HL, 10, '')
})

document.getElementById('dn-more-news-search').addEventListener('click', function () {
  if (curPage_E >= totalPage_E) {
    return
  } else if (curPage_E < totalPage_E && curPage_E + 10 >= totalPage_E) {
    //Update the number of page showed
    curPage_E = totalPage_E
  } else {
    //Update the number of page showed
    curPage_E += 10
  }

  //Update the current batch and display HTML
  page_E += 1
  displaySearch(myCategory, page_E, 10, '')
})

//Async function to fetch data based on 5 customed parameters from API News
async function fetchNews(endpoint, category, page, pageSize, q) {
  //Get the origin
  let origin = `${domain}/${endpoint}?`

  //Group all parameters to 1 object
  parameters = { 'category': category, 'q': q, 'country': 'us', 'language': 'en', 'pageSize': pageSize, 'page': page, 'apiKey': apiKey }

  //If the endpoint is everything, delete category&country attribute as this endpoint doesn't have category&country
  if (endpoint === 'everything') {
    delete parameters.category
    delete parameters.country
  }

  //Construct a complete url
  let url = Object.keys(parameters).reduce((total, item) => {
    return total += `${item}=${parameters[item]}&`
  }, origin)

  //Clean the url - trim the last character
  url = url.slice(0, url.length - 1)

  //Fetch and convert to json value
  try {
    let response = await fetch(url)
    let data = await response.json()

    if (data.status === 'ok') {
      //Concat the article objects to our array whenever fetching new data
      if (endpoint === 'top-headlines') {
        headlineHTML = headlineHTML.concat(data['articles'])
      } else if (endpoint === 'sources') {
        sourceHTML = sortCategorySource(data['sources'])
      } else {
        everythingHTML = everythingHTML.concat(data['articles'])
      }
      return data

    } else return
  } catch (err) {
    console.log('There is error connecting to the API')
    return
  }
}

//Function to display the news to our page - FETCH DATA HERE
async function displayHeadline(category, page, pageSize, q) {
  //Get the endpoint
  let endpoint = Object.keys(endpoints)[0]

  //Fetch the new news from News API
  let data = await fetchNews(endpoint, category, page, pageSize, q)

  //Get the total result and current number of pages
  totalPage_HL = data['totalResults']

  //Capitalize the category
  category = category.charAt(0).toUpperCase() + category.slice(1)

  //Show the updated number of news showed to UI
  document.getElementById('dn-show-id').innerText = `Show ${curPage_HL} of ${totalPage_HL} ${category} articles`

  //Get all available data to constrct html tags
  let newsHTML = headlineHTML.reduce((total, item, index) => {
    let imgSrc = item['urlToImage']
    let title = item['title']
    let description = item['description']
    let url = item['url']
    let publishedAt = moment(item['publishedAt']).fromNow()
    let source = item['source']['name']

    return total += `<div class="card dn-card">
                        <div class="row no-gutters">
                          <div class="col-md-2">
                            <img src="${imgSrc}" class="dn-card-img card-img" alt="...">
                          </div>
                          <div class="col-md-10">
                            <div class="card-body">
                              <h5 class="card-${index}-title"><a href='${url}'>${title}</a></h5>
                              <p class="card-text dn-text">${description}</p>
                              <span class="card-text"><small class="text-muted">${source}</small></span> - 
                              <span class="card-text"><small class="text-muted">${publishedAt}</small></span>
                            </div>
                          </div>
                        </div>
                      </div>`
  }, '')

  //Update the html tags
  document.getElementById('dn-news-main').innerHTML = newsHTML
}

//Function to display all sources to our page - FETCH DATA HERE
async function displaySource() {
  //Get the dropdown menu tag
  let x = document.getElementById('dn-show-categories')
  let y = document.getElementById('dn-fact-check')

  //Choose to display if the user click on button or not
  if (x.style.display === 'none') {
    x.style.display = 'block'
    y.style.display = 'block'
    document.getElementById('dn-showall').innerText = "Show less"
  } else {
    x.style.display = 'none'
    y.style.display = 'none'
    document.getElementById('dn-showall').innerText = 'Show all'
  }

  //Take the end point and fetch the data
  let endpoint = Object.keys(endpoints)[1]
  data = await fetchNews(endpoint, '', '', '', '')

  //By default, all-input checkbox is checked
  document.getElementById('all-input').checked = true

  //Construct card tags for sources
  let newsHTML = data['sources'].reduce((total, item) => {
    let description = item['description']
    let url = item['url']
    let name = item['name']
    let category = item['category']

    return total += `<div class="dn-card-fc dn-card-${category}">
      <div class="card-body dn-card-fact-check">
        <h6 class="card-title"><a href='${url}'>${name}</a></h6>
        <p class="card-subtitle mb-2 text-muted dn-card-fact-text">${category}</p>
        <p class="card-text dn-card-fact-text">${description}</p>
      </div>
    </div>`
  }, '')

  //Update the UI
  document.getElementById('dn-fact-check').innerHTML = newsHTML
}

//Function to display all searched news to our page - FETCH DATA HERE
async function displaySearch() {
  //Get the input data from user
  let query = document.getElementById('dn-search-input').value

  //If the input is empty string, return immediately - do nothing
  if (query === '') {
    return
  }

  //Take the endpoint and fetch the data
  let endpoint = Object.keys(endpoints)[2]
  data = await fetchNews(endpoint, '', 1, 10, query)

  //Get the total result and current number of pages
  totalPage_E = data['totalResults']

  //Show the updated number of news showed to UI
  document.getElementById('dn-search-text').style.display = 'block'
  document.getElementById('dn-search-text').innerText = `Show ${curPage_E} of ${totalPage_E} articles of key '${query}'`

  //Construct card tags for sources
  let newsHTML = everythingHTML.reduce((total, item, index) => {
    let imgSrc = item['urlToImage']
    let title = item['title']
    let url = item['url']
    let publishedAt = moment(item['publishedAt']).fromNow()
    let source = item['source']['name']

    return total += `<div class="dn-search-card">
                        <div class="row no-gutters">
                          <div class="col-md-2">
                            <img src="${imgSrc}" class="card-img" alt="...">
                          </div>
                          <div class="col-md-10">
                            <div class="card-body">
                              <h6 class="card-${index}-title"><a href='${url}'>${title}</a></h6>
                              <span class="card-text"><small class="text-muted">${source}</small></span> - 
                              <span class="card-text"><small class="text-muted">${publishedAt}</small></span>
                            </div>
                          </div>
                        </div>
                      </div>`
  }, '')

  //Update the html tags to our search bar
  document.getElementById('dn-search-news').innerHTML = newsHTML
}

//Function to sort the number of categorical news
function sortCategorySource(data) {
  //Get the list of all categories
  let lst = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology']
  let result = new Object()

  //Filter news based on its category
  for (let i = 0; i < lst.length; i++) {
    result[lst[i]] = data.filter((item, index) => item['category'] === lst[i])
    document.getElementById(lst[i]).innerHTML = result[lst[i]].length
  }

  //Get the total news and update the UI
  document.getElementById('all').innerHTML = Object.keys(result).reduce((total, item) => total += result[item].length, 0)
  return result
}

//Function to display the categorical news that users clicked on
function sourceClick() {
  //Get the all-input checkbox
  let all = document.getElementById('all-input')

  //Get all keys (all categories) of sourceHTML
  let lst = Object.keys(sourceHTML)

  //Display all sources if user click All button
  if (all.checked) {
    for (let i = 0; i < lst.length; i++) {
      let collections = document.getElementsByClassName(`dn-card-${lst[i]}`)
      for (let j = 0; j < collections.length; j++) {
        collections[j].style.display = 'block'
      }
    }
    return
  }

  for (let i = 0; i < lst.length; i++) {
    let collections = document.getElementsByClassName(`dn-card-${lst[i]}`)
    let category = document.getElementById(`${lst[i]}-input`)

    if (category.checked == true) {
      for (let j = 0; j < collections.length; j++) {
        collections[j].style.display = 'block'
      }
    } else {
      for (let j = 0; j < collections.length; j++) {
        collections[j].style.display = 'none'
      }
    }
  }
}

//Function to display categorized Headline news - FETCH DATA HERE
async function categorizeHL(category) {
  //Reset all variables that are used for headlines
  curPage_HL = 10
  page_HL = 1
  headlineHTML = []
  myCategory = ''

  if (category === 'all') {
    //Display all news with no categories mentioned
    displayHeadline('', page_HL, curPage_HL, '')
  } else {
    //Display all news of specific category
    myCategory = category
    displayHeadline(category, page_HL, curPage_HL, '')
  }
}

function search() {
  //Reset all variables to default settings
  page_E = 1
  curPage_E = 10
  totalPage_E = 0
  everythingHTML = []

  //Fetch new data with updated variables
  displaySearch()
}

//Function to display current information from Weather API
async function displayWeather() {
  //Get the main and all parameters
  let domain = 'https://api.openweathermap.org/data/2.5/weather?'
  parameters = { id: 1566083, cnt: 7, appid: 'f89a7c459a1bb745851f7a1adc58324f'}

  //Construct the url
  url = Object.keys(parameters).reduce((total, item) => {
    return total += `${item}=${parameters[item]}&`
  }, domain)

  //Clean the url
  url = url.slice(0, url.length-1)

  //Try to fetch the url
  try{
    response = await fetch(url)
    data = await response.json()

    //Get the data
    if (data['weather']){
      let city = data['name']
      let main = data['main']
      let sys = data['sys']
      let wind = data['wind']

      //Convert from F to C degree
      let FtoC = (temp)=>{
        return (temp-32)*5/9
      } 

      //Construct the html tags from api data
      document.getElementById('dn-weather').innerHTML = `
      <div class='dn-weather-box'>
      <p>${city}</p>
      <p>Country: ${sys['country']}</p>
      <p>Temperature: ${FtoC(main['temp']).toFixed(2)} C<br>Feel like: ${FtoC(main['feels_like']).toFixed(2)} C<br>Temperature min: ${FtoC(main['temp_min']).toFixed(2)} C<br> Temperature max: ${FtoC(main['temp_max']).toFixed(2)} C<br> Pressure: ${FtoC(main['pressure']).toFixed(2)} C</p></div>`
    }
  }catch(err){
    //Catch the error if we failed to connect to API
    console.log('Failed to connect to API')
  }
}

//START THE PAGE
displayHeadline('', 1, 10, '')
displayWeather()

//Set the sources to be displayed by default
let x = document.getElementById('dn-show-categories')
let y = document.getElementById('dn-fact-check')
x.style.display = 'block'
y.style.display = 'block'