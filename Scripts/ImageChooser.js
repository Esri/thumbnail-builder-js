/*global define*/
define(function () {
	/**
	 * A class that constructs and manages a list of image choices.
	 * @param {HTMLElement} root
	 * @param {esri/arcgis/Portal} portal
	 */
	function ImageChooser(root) {
		if (!root) {
			throw new TypeError("No root element provided");
		}
		this.rootNode = root;
		this.rootNode.classList.add("image-chooser");
		this.list = document.createElement("ul");
		this.rootNode.appendChild(this.list);
	}

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
		label.appendChild(radio);
		label.appendChild(document.createTextNode(item.title));


		img = document.createElement("img");
		img.src = item.thumbnailUrl;
		label.appendChild(img);


		return li;
	};

	/**
	 * 
	 * @property {string} url
	 */
	ImageChooser.prototype.addImage = function (item) {
		var li = this._createListItem(item);
		if (li) {
			this.list.appendChild(li);
		}
	};

	/**
	 * 
	 * @property {string[]} urls
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

	return ImageChooser;
});