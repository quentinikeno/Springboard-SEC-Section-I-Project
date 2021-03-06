"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
	storyList = await StoryList.getStories();
	$storiesLoadingMsg.remove();

	putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
	//console.debug("generateStoryMarkup", story);
	//Class for the favorite story-star
	let starClass = "far";
	let isFavorite = false;
	//Class whether the delete icon will be hidden.  Hide the delete icon if the story is not the users own story
	let deleteClass = "hidden";
	//If a user is logged in
	if (currentUser) {
		//If the storyId is in the user's favorites, set the class for the favorite story-star so that it's filled in in the markup below
		const { favorites, ownStories } = currentUser;
		if (favorites.find((favorite) => favorite.storyId === story.storyId)) {
			starClass = "fas";
			isFavorite = true;
		}
		if (ownStories.find((ownStory) => ownStory.storyId === story.storyId)) {
			deleteClass = "";
		}
	} else {
		starClass = "hidden";
	}

	const hostName = story.getHostName();
	return $(`
      <li id="${story.storyId}">
	  	<i class="story-star ${starClass} fa-star" data-favorite=${isFavorite}></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
		<i class="far fa-trash-alt delete ${deleteClass}"></i>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
	console.debug("putStoriesOnPage");

	$allStoriesList.empty();

	// loop through all of our stories and generate HTML for them
	for (let story of storyList.stories) {
		const $story = generateStoryMarkup(story);
		$allStoriesList.append($story);
	}

	$allStoriesList.show();
}

//Write a function in stories.js that is called when users submit the form. Pick a good name for it.
//This function should get the data from the form, call the .addStory method you wrote, and then put that new story on the page.
async function submitStory(evt) {
	evt.preventDefault();
	//Get title, author and url from story submit form
	const title = $("#story-title").val();
	const author = $("#story-author").val();
	const url = $("#story-url").val();
	//Use the addStory method for the current user and an object with the data from the story submit form
	const addedStory = await StoryList.addStory(currentUser, {
		title,
		author,
		url,
	});
	//Add the returned new story to the currentUsers ownStories
	currentUser.ownStories = [...currentUser.ownStories, addedStory];
	//Get the stories again and put them on the page
	await getAndShowStoriesOnStart();
	//Hide the story submit form
	$submitForm.hide();
}

$submitForm.on("submit", submitStory);

/** Gets list of favorite stories from currentUser, generates their HTML, and puts on page. */

function putFavoritesOnPage() {
	console.debug("putFavoritesOnPage");
	const { favorites } = currentUser;

	$allStoriesList.empty();

	if (favorites.length) {
		// loop through all of our stories and generate HTML for them
		for (let favorite of favorites) {
			const $favorite = generateStoryMarkup(favorite);
			$allStoriesList.append($favorite);
		}
	} else {
		//if favorites list is empty, append the paragraph below
		$allStoriesList.append($("<h4>No favorites added!<h4>"));
	}

	$allStoriesList.show();
}

$navFavorites.on("click", putFavoritesOnPage);

//Delete story
async function deleteClickedStoryUpdateUI() {
	console.debug("deleteClickedStory");
	const $parentLi = $(this).parent();
	//Get the story ID from the parent Li's id
	const storyId = $parentLi.attr("id");
	const { ownStories, favorites } = currentUser;
	//Confirm with user if they want to delete the story
	if (window.confirm("Are you sure you want to delete this story?")) {
		//Delete story with the deleteStory method using the API
		await StoryList.deleteStory(currentUser, storyId);
		//Remove the deleted story from the currentUser's ownStories array
		removeStoryFromArray(ownStories, storyId);
		//Remove the deleted story from the currentUser's favorites array
		removeStoryFromArray(favorites, storyId);
		//Remove story from the DOM
		$parentLi.fadeOut(700, function () {
			$(this).remove();
		});
	}
}

function removeStoryFromArray(arr, storyId) {
	const storyIndex = arr.findIndex((el) => el.storyId === storyId);
	if (storyIndex !== -1) {
		arr.splice(storyIndex, 1);
	}
}

$allStoriesList.on("click", "i.delete", deleteClickedStoryUpdateUI);
