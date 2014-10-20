/*global define*/
define(function () {
	/**
	 * ImageChooser module.
	 *  @exports ImageChooser
	 */


	/**
	 * An ArcGIS Online portal item.
	 * @external PortalItem
	 * @link {@see https://developers.arcgis.com/javascript/jsapi/portalitem-amd.html PortalItem}
	 */

	/**
	 * A class that constructs and manages a list of image choices.
	 * @param {HTMLElement} root
	 * @param {string} formName - The value that will be given to the "name" attributes of the radio buttons.
	 * @constructor
	 */
	function ImageChooser(root, formName) {
		if (!root) {
			throw new TypeError("No root element provided");
		}
		if (!formName) {
			throw new TypeError("No formName was provided.");
		}
		this.rootNode = root;
		this.rootNode.classList.add("image-chooser");
		this.list = document.createElement("ul");
		this.rootNode.appendChild(this.list);
		this.formName = formName;

		// Add file input
		var fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = "image/*";
		fileInput.name = "bg-file";
		this.fileInput = fileInput;
		this.rootNode.appendChild(fileInput);

		var self = this;

		// When the user adds a file, add it to the list of files.
		fileInput.addEventListener("change", function (e) {
			var target = e.target, file, reader, li;
			if (target.files.length) {
				file = target.files[0];
				
				reader = new FileReader();

				reader.onloadend = function () {
					li = self.addImage({
						thumbnailUrl: reader.result,
						title: file.name
					});
					li.scrollIntoView(false);
					li.querySelector("input[type=radio]").checked = true;

				};

				reader.readAsDataURL(file);
			}
		});
	}

	/**
	 * Creates a list item in the list representing an AGOL item.
	 * @param {PortalItem} item
	 */
	ImageChooser.prototype._createListItem = function (item) {
		if (!(item && item.thumbnailUrl)) {
			throw new TypeError("No URL provided.");
		}

		/*
		li
			label
				input[type=radio]
				img
		*/
		var li, radio, label, img;
		li = document.createElement("li");

		label = document.createElement("label");
		li.appendChild(label);


		radio = document.createElement("input");
		radio.type = "radio";
		radio.value = item.thumbnailUrl;
		radio.name = this.formName;
		if (item.id) {
			radio.setAttribute("data-agol-id", item.id);
		}
		label.appendChild(radio);
		if (item.title) {
			label.appendChild(document.createTextNode(item.title));
		}


		img = document.createElement("img");
		img.src = item.thumbnailUrl;
		img.title = item.title || "Image";
		label.appendChild(img);


		return li;
	};

	/**
	 * Adds a single image to the image chooser.
	 * If you are adding multiple images, use the addImages function instead.
	 * @param {string} url
	 * 
	 */
	ImageChooser.prototype.addImage = function (item) {
		var li = this._createListItem(item);
		if (li) {
			this.list.appendChild(li);
		}
		return li;
	};

	/**
	 * Adds multiple images to the image chooser.
	 * @param {string[]} urls
	 */
	ImageChooser.prototype.addImages = function (items) {
		var frag, li, self = this;
		if (items && items.length) {
			frag = document.createDocumentFragment();
			items.forEach(function (item) {
				li = self._createListItem(item);
				frag.appendChild(li);
			});
		}
		if (frag) {
			this.list.appendChild(frag);
		}
	};

	/**
	 * Returns the currently selected image.
	 * @returns {HTMLImageElement}
	 */
	ImageChooser.prototype.getSelectedImage = function () {
		var checkedRB = this.list.querySelector("input:checked");
		return checkedRB ? checkedRB.parentNode.querySelector("img") : null;
	};

	return ImageChooser;
});