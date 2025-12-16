/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  good.js
  Script for validation/tests/targets/buttonMenu/good.html
*/

// UTILITIES FOR EVENT HANDLERS

// Returns the menu controlled by a menu button.
const controlledMenu = button => document.getElementById(button.getAttribute('aria-controls'));
// Returns the button controlling a menu.
const controller = menu => document.body.querySelector(`button[aria-controls=${menu.id}`);
// Returns whether an element is a menu item.
const isMenuItem = element => element.getAttribute('role') === 'menuitem';
// Returns the focus type of a menu.
const focusTypeOf = menu => menu.hasAttribute('aria-activedescendant') ? 'fake' : 'true';
// Closes a menu controlled by a button.
const closeMenu = button => {
  // If the menu is open:
  if (button.ariaExpanded === 'true') {
    // Close it.
    button.setAttribute('aria-expanded', 'false');
    const menu = controlledMenu(button);
    menu.className = 'shut';
    menu.tabIndex = -1;
  }
};
// Returns the menu items of a menu.
const menuItemsOf = menu => {
  const items = [];
  const children = Array.from(menu.children);
  children.forEach(child => {
    if (isMenuItem(child)) {
      items.push(child);
    }
    else {
      const grandchild = child.firstElementChild;
      if (grandchild.getAttribute('role')) {
        items.push(grandchild);
      }
    }
  });
  return items;
};
// Returns the menu that a menu item is an item of.
const owningMenuOf = menuItem => {
  const parent = menuItem.parentElement;
  const parentRole = parent.getAttribute('role');
  if (parentRole.startsWith('menu')){
    return parent;
  }
  else {
    const grandparent = parent.parentElement;
    const grandparentRole = grandparent.getAttribute('role');
    if (grandparentRole.startsWith('menu')) {
      return grandparent;
    }
    else {
      return null;
    }
  }
};
// Returns the index of the active menu item of a menu, or -1 if none.
const activeIndexOf = (isButton, buttonOrMenu) => {
  const menu = isButton ? controlledMenu(buttonOrMenu) : buttonOrMenu;
  const items = menuItemsOf(menu);
  // If the menu is a fake focus manager, return the index.
  if (menu.hasAttribute('aria-activedescendant')) {
    const activeID = menu.getAttribute('aria-activedescendant');
    if (activeID) {
      const itemIDs = items.map(item => item.id);
      return itemIDs.indexOf(activeID);
    }
    else {
      return -1;
    }
  }
  // Otherwise, i.e. if the menu is a true focus manager, return the index.
  else {
    const tabIndexes = items.map(item => item.tabIndex);
    return tabIndexes.indexOf(0);
  }
};
// Makes the specified (or the last if -1) menu item active and closes any sibling menus.
const setActive = (focusType, menu, itemIndex) => {
  // Identify the menu items.
  const menuItems = menuItemsOf(menu);
  // Identify the specified index.
  const newIndex = itemIndex === -1 ? menuItems.length - 1 : itemIndex;
  // For each menu item in the menu:
  menuItems.forEach((item, index) => {
    // If it has the specified index:
    if (index === newIndex) {
      // If the menu is a pseudofocus manager:
      if (focusType === 'fake') {
        // Mark the item as focal.
        item.className = 'focal';
        menu.setAttribute('aria-activedescendant', item.id);
        // Ensure that the menu is in focus.
        menu.tabIndex = 0;
        menu.focus();
      }
      // Otherwise, if the menu is a true focus manager:
      else if (focusType === 'true') {
        // Make the item focusable.
        item.tabIndex = 0;
        // Focus it.
        item.focus();
      }
    }
    // Otherwise, i.e. if the menu item does not have the specified index:
    else {
      // If the menu is a pseudofocus manager:
      if (focusType === 'fake') {
        // Mark the item as nonfocal.
        item.className = 'blurred';
      }
      // Otherwise, if the menu is a true focus manager:
      else if (focusType === 'true') {
        // Make the item nonfocusable.
        item.tabIndex = -1;
      }
      // Close the menu controlled by the item if the item is a menu button.
      closeMenu(item);
    }
  });
};
// Opens a menu controlled by a button and makes an item active.
const openMenu = (button, newIndex) => {
  // Open the menu (Chrome fails to support settable ariaExpanded property).
  button.setAttribute('aria-expanded', 'true');
  const menu = controlledMenu(button);
  menu.className = 'open';
  const focusType = focusTypeOf(menu);
  // If an active index was specified:
  if (newIndex > -2) {
    // Make the specified menu item active.
    setActive(focusType, menu, newIndex);
  }
  // Otherwise, i.e. if no active index was specified:
  else {
    // Make the currently active menu item, or if none the first one, active.
    const oldIndex = activeIndexOf(true, button);
    setActive(focusType, menu, oldIndex > -1 ? oldIndex : 0);
  }
};
// Navigates within a menu according to a key press and returns the newly active index.
const keyNav = (isBar, menu, key, focusType) => {
  const oldIndex = activeIndexOf(false, menu);
  const menuItems = menuItemsOf(menu);
  const menuItemCount = menuItems.length;
  // Initialize the chosen index as the current index.
  let newIndex = oldIndex;
  // If the request is for the next menu item:
  if (key === (isBar ? 'ArrowRight' : 'ArrowDown')) {
    // Change the index to the next menu item’s, wrapping.
    newIndex = (oldIndex + 1) % menuItemCount;
  }
  // Otherwise, if the request is for the previous menu item:
  else if (key === (isBar ? 'ArrowLeft' : 'ArrowUp')) {
    // Change the index to the previous menu item’s, wrapping.
    newIndex = (menuItemCount + oldIndex - 1) % menuItemCount;
  }
  else if (key === 'Home') {
    newIndex = 0;
  }
  else if (key === 'End') {
    newIndex = menuItemCount - 1;
  }
  // Otherwise, if the request is for a menu item with an initial letter:
  else if (/^[a-zA-Z]$/.test(key)) {
    // Change the index to the next matching menu item’s, if there is one.
    const matches = menuItems.map((item, index) =>
      item.textContent.toLowerCase().trim().startsWith(key.toLowerCase()) ? index : -1
    );
    const laterMatches = matches.filter(index => index > -1 && index > oldIndex);
    if (laterMatches.length) {
      newIndex = laterMatches[0];
    }
  }
  // Make the menu item with the new index active.
  if (newIndex > -1) {
    setActive(focusType, menu, newIndex);
  }
  // Return the new index.
  return newIndex;
};

// EVENT LISTENERS

// Handle clicks.
document.body.addEventListener('click', event => {
  // Identify the click target.
  let target = event.target;
  // If it is a menu item:
  if (isMenuItem(target)) {
    // Identify the menu that owns it.
    const menu = owningMenuOf(target);
    // If the owning menu exists:
    if (menu) {
      // Make the menu item active.
      const itemIndex = menuItemsOf(menu).indexOf(target);
      setActive(focusTypeOf(menu), menu, itemIndex);
      // If the menu item is also a menu button:
      if (target.tagName === 'BUTTON' && ['menu', 'true'].includes(target.ariaHasPopup)) {
        // If the menu it controls is closed:
        if (target.ariaExpanded === 'false') {
          // Open it with the first item active.
          openMenu(target, 0);
        }
        // Otherwise, if the menu it controls is open:
        else if (target.ariaExpanded === 'true') {
          // Close it.
          closeMenu(target);
        }
      }
      // Otherwise, if the menu item is also a link:
      else if (target.tagName === 'A') {
        // Identify the button controlling the menu, if any.
        const ownerButton = controller(menu);
        // If the menu has a controlling button:
        if (ownerButton) {
          // If the button is also a menu item:
          if (isMenuItem(ownerButton)) {
            // Identify the menu that it is an item of.
            const ownerMenu = owningMenuOf(ownerButton);
            // If it exists:
            if (ownerMenu) {
              // Identify the menu button’s index as a menu item.
              const ownerIndex = menuItemsOf(ownerMenu).indexOf(ownerButton);
              // Make it active.
              setActive(focusTypeOf(ownerMenu), ownerMenu, ownerIndex);
            }
          }
        }
      }
    }
  }
});
// Handle key presses.
window.addEventListener('keydown', event => {
  const key = event.key;
  // If no ineligible modifier key was in effect when the key was depressed:
  if (! (event.altKey || event.ctrlKey || event.metaKey)) {
    // Identify whether the shift key was in effect.
    const shift = event.shiftKey;
    // Initialize the focused element.
    let focus = document.activeElement;
    // If it exists and is within the body:
    if (focus && focus !== document.body) {
      // Change it to the effectively focused element if different.
      if (focus.hasAttribute('aria-activedescendant')) {
        focus = document.getElementById(focus.getAttribute('aria-activedescendant'));
      }
      // If it is a menu item:
      if (focus.getAttribute('role') === 'menuitem') {
        // Identify the menu that the item is in.
        const menu = owningMenuOf(focus);
        // If it exists:
        if (menu) {
          // Identify the role of the menu.
          const menuRole = menu.getAttribute('role');
          // Identify whether the menu manages pseudofocus or true focus.
          const focusType = focusTypeOf(menu);
          // Identify the menu button controlling the menu, if any.
          const ownerButton = controller(menu);
          // Initialize the type of the focused element as inoperable.
          let itemType = 'plain';
          // Revise the type if it is operable.
          const tagName = focus.tagName;
          if (tagName === 'A') {
            itemType = 'link';
          }
          else if (tagName === 'BUTTON') {
            itemType = focus.ariaExpanded ? 'menuButton' : 'button';
          }
          // If the key is Enter:
          if (key === 'Enter' && ! shift) {
            // If the menu item is a link or ordinary button:
            if (['link', 'button'].includes(itemType)) {
              // Simulate a click on it.
              focus.click();
            }
            // Otherwise, if the menu item is a menu button:
            else if (itemType === 'menuButton') {
              // Its menu must be closed, so open it, with the first item active.
              openMenu(focus, 0);
            }
          }
          // Otherwise, if the key is Space:
          else if (key === ' ' && ! shift) {
            // If the menu item is an ordinary button:
            if (itemType === 'button') {
              // Prevent default scrolling.
              event.preventDefault();
              // Simulate a click on the button.
              focus.click();
            }
            // Otherwise, if the menu item is a menu button:
            else if (itemType === 'menuButton') {
              // Prevent default scrolling.
              event.preventDefault();
              // Its menu must be closed, so open it, with the first item active.
              openMenu(focus, 0);
            }
          }
          // Otherwise, if the key is Tab and the menu is closable:
          else if (key === 'Tab' && ownerButton) {
            // Close the menu.
            closeMenu(ownerButton);
          }
          // Otherwise, if the key is Escape and the menu is closable:
          else if (key === 'Escape' && ! shift && ownerButton) {
            // Close the menu.
            closeMenu(ownerButton);
            // Focus its menu button.
            ownerButton.focus();
          }
          // Otherwise, if the key is a letter:
          else if (/^[a-zA-Z]$/.test(key)) {
            // Navigate within the menu according to the key.
            keyNav(true, menu, key, focusType);
          }
          // Otherwise, if the key navigates among parent menu items in a menu bar:
          else if (['ArrowLeft', 'ArrowRight'].includes(key)) {
            // If the focused element is a menu button in a menu bar:
            if (itemType === 'menuButton' && menuRole === 'menubar') {
              // Navigate within the menu bar according to the key.
              keyNav(true, menu, key, focusType);
            }
            // Otherwise, if the focused element is a button-controlled menu item:
            else if (menuRole === 'menu' && ownerButton) {
              // Close the menu.
              closeMenu(ownerButton);
              // Identify the menu bar.
              const bar = owningMenuOf(ownerButton);
              // Obey the key.
              const newBarIndex = keyNav(true, bar, key, focusTypeOf(bar));
              // Open the menu controlled by the newly focused menu button and focus its first item.
              openMenu(menuItemsOf(bar)[newBarIndex], 0);
            }
          }
          // Otherwise, if the key specially navigates within the menu:
          else if (['Home', 'End'].includes(key) && ! shift) {
            // Prevent default page scrolling.
            event.preventDefault();
            // Obey the key.
            keyNav(true, menu, key, focusType);
          }
          // Otherwise, if the key conditionally navigates or opens a menu:
          else if (['ArrowUp', 'ArrowDown'].includes(key) && ! shift) {
            // If the focused element is a menu button in a menu bar:
            if (menuRole === 'menubar' && itemType === 'menuButton') {
              // Prevent default scrolling.
              event.preventDefault();
              // Open the menu button’s menu.
              openMenu(focus, key === 'ArrowUp' ? -1 : 0);
            }
            // Otherwise, if the active item is not a menu button and is in a menu:
            else if (menuRole === 'menu' && itemType !== 'menuButton') {
              // Prevent default scrolling.
              event.preventDefault();
              // Obey the key.
              keyNav(false, menu, key, focusType);
            }
          }
        }
      }
    }
  }
});
