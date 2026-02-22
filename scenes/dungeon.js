const DUNGEON_TYPES = {
    jungle_temple: {
        description: 'Vines writhe like serpents around idols that weep blood. The air is thick with the stench of decay and something... alive. Whispers echo from the shadows.',
        choices: [
            {
                text: 'Examine the idols (Risk: Trap + Curse)',
                risk: () => {
                    const trap = rr() < 0.4;
                    const curse = rr() < 0.3;
                    if (trap) {
                        G.hp = clamp(G.hp - 10, 0, 100);
                        printLog('Poisoned darts strike you!', 'alert');
                    }
                    if (curse) {
                        G.san = clamp(G.san - 10, 0, 100);
                        printLog('Ancient curses whisper madness.', 'alert');
                    }
                    if (!trap && !curse) {
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('golden_idol');
                        G.mat.canvas += 2;
                        G.morale = clamp(G.morale + 10, 0, 100);
                        printLog('You claim the idol and salvage canvas from the vines. Spirits soar!', 'normal');
                        if (rr() < 0.2) {
                            G.san -= 10;
                            printLog('The idol whispers curses into your mind.', 'alert');
                        }
                    }
                }
            },
            {
                text: 'Search the altar (Risk: Madness)',
                risk: () => {
                    if (rr() < 0.3) {
                        G.san = clamp(G.san - 15, 0, 100);
                        G.hp = clamp(G.hp - 5, 0, 100);
                        printLog('Visions assault you, weakening body and mind.', 'alert');
                    } else {
                        G.foodStocks.citrus += 3;
                        G.mat.canvas += 1;
                        G.navError = Math.max(0.5, G.navError * 0.95);
                        printLog('You find fruits, canvas scraps, and a navigational clue.', 'normal');
                    }
                }
            }
        ]
    },

    mountain_cave: {
        description: 'A narrow crevice leads to a vast underground chamber. Stalactites hang like daggers, and veins of ore pulse with an unnatural glow. The walls seem to breathe.',
        choices: [
            {
                text: 'Mine the ore (Risk: Collapse + Injury)',
                risk: () => {
                    const collapse = rr() < 0.3;
                    if (collapse) {
                        G.hp = clamp(G.hp - 8, 0, 100);
                        G.mat.metal += 2;
                        printLog('Rocks fall, but you salvage some ore before fleeing.', 'alert');
                    } else {
                        G.mat.metal += 5;
                        G.mat.canvas += 3;
                        printLog('Rich veins yield metal and canvas for repairs.', 'normal');
                    }
                }
            },
            {
                text: 'Explore deeper (Risk: Lost)',
                risk: () => {
                    if (rr() < 0.4) {
                        G.san = clamp(G.san - 10, 0, 100);
                        printLog('The depths disorient you, fraying your sanity.', 'alert');
                    } else {
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('pirate_map');
                        G.mat.canvas += 2;
                        G.morale = clamp(G.morale + 5, 0, 100);
                        printLog('You discover a map, canvas, and a sense of adventure.', 'normal');
                    }
                }
            }
        ]
    },

    lava_chamber: {
        description: 'The heat is oppressive as you descend into a chamber where molten rock bubbles. Forges from a forgotten age line the walls, still glowing faintly.',
        choices: [
            {
                text: 'Approach the forge (Risk: Burn + Equipment Damage)',
                risk: () => {
                    const burn = rr() < 0.4;
                    if (burn) {
                        G.hp = clamp(G.hp - 10, 0, 100);
                        G.mat.canvas -= 1;
                        printLog('Heat melts your canvas and scorches your skin!', 'alert');
                    } else {
                        G.mat.metal += 4;
                        G.mat.canvas += 3;
                        G.san = clamp(G.san + 5, 0, 100);
                        printLog('You harness the forge\'s power, gaining materials and insight.', 'normal');
                    }
                }
            },
            {
                text: 'Inspect the runes (Risk: Overload)',
                risk: () => {
                    if (rr() < 0.3) {
                        G.san = clamp(G.san - 12, 0, 100);
                        G.hp = clamp(G.hp - 3, 0, 100);
                        printLog('The runes overload your senses with pain and visions.', 'alert');
                    } else {
                        G.navError = Math.max(0.5, G.navError * 0.9);
                        G.mat.canvas += 1;
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('forge_rune');
                        printLog('The runes teach navigation and yield a rune artifact.', 'normal');
                    }
                }
            }
        ]
    },

    ancient_ruins: {
        description: 'Collapsed stone walls and weathered statues surround you. Faint whispers echo through the ruins, hinting at secrets long buried.',
        choices: [
            {
                text: 'Decipher the inscriptions (Risk: Madness + Time)',
                risk: () => {
                    const madness = rr() < 0.3;
                    if (madness) {
                        G.san = clamp(G.san - 15, 0, 100);
                        G.morale = clamp(G.morale - 10, 0, 100);
                        printLog('The inscriptions shatter your mind and hope.', 'alert');
                    } else {
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('ancient_scroll');
                        G.mat.canvas += 2;
                        G.hp = clamp(G.hp + 5, 0, 100);
                        printLog('The scroll restores health and provides canvas knowledge.', 'normal');
                    }
                }
            },
            {
                text: 'Search for artifacts (Risk: Trap)',
                risk: () => {
                    if (rr() < 0.2) {
                        G.hp = clamp(G.hp - 8, 0, 100);
                        G.san = clamp(G.san - 5, 0, 100);
                        printLog('A trap injures you and haunts your thoughts.', 'alert');
                    } else {
                        G.navError = Math.max(0.5, G.navError * 0.9);
                        G.mat.canvas += 1;
                        G.morale = clamp(G.morale + 8, 0, 100);
                        printLog('You find tools that improve navigation and morale.', 'normal');
                    }
                }
            }
        ]
    },

    underwater_cavern: {
        description: 'You dive into a submerged cavern accessible only at low tide. Bioluminescent algae illuminates crystal-clear water and strange, pulsating coral formations.',
        choices: [
            {
                text: 'Harvest the coral (Risk: Toxic Reaction)',
                risk: () => {
                    const toxic = rr() < 0.35;
                    if (toxic) {
                        G.hp = clamp(G.hp - 12, 0, 100);
                        G.san = clamp(G.san - 8, 0, 100);
                        printLog('The coral releases a toxic cloud that burns your skin and mind!', 'alert');
                    } else {
                        G.mat.canvas += 4;
                        G.mat.rope += 2;
                        G.san = clamp(G.san + 3, 0, 100);
                        printLog('The coral yields strong fibers and canvas-like materials. The beauty calms you.', 'normal');
                    }
                }
            },
            {
                text: 'Explore the deep chamber (Risk: Pressure + Drowning)',
                risk: () => {
                    const pressure = rr() < 0.4;
                    if (pressure) {
                        G.hp = clamp(G.hp - 15, 0, 100);
                        G.san = clamp(G.san - 5, 0, 100);
                        printLog('Pressure builds dangerously, forcing you to surface gasping.', 'alert');
                    } else {
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('pearl_necklace');
                        G.mat.metal += 3;
                        G.morale = clamp(G.morale + 12, 0, 100);
                        printLog('You discover pearls, precious metal, and a wondrous sense of discovery!', 'normal');
                    }
                }
            }
        ]
    },

    desert_tomb: {
        description: 'Sand-choked passages lead to a tomb carved from ancient sandstone. Hieroglyphs cover the walls, and the air is dry and still, carrying the scent of millennia.',
        choices: [
            {
                text: 'Open the sarcophagus (Risk: Mummy Curse)',
                risk: () => {
                    const curse = rr() < 0.45;
                    if (curse) {
                        G.hp = clamp(G.hp - 8, 0, 100);
                        G.san = clamp(G.san - 18, 0, 100);
                        G.morale = clamp(G.morale - 15, 0, 100);
                        printLog('The mummy awakens! Its curse drains your life and hope.', 'alert');
                    } else {
                        G.mat.metal += 6;
                        G.mat.canvas += 2;
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('golden_mask');
                        printLog('The tomb yields gold, canvas wrappings, and a magnificent mask artifact.', 'normal');
                    }
                }
            },
            {
                text: 'Study the hieroglyphs (Risk: Time + Confusion)',
                risk: () => {
                    const confusion = rr() < 0.25;
                    if (confusion) {
                        G.san = clamp(G.san - 10, 0, 100);
                        G.navError = Math.min(10, G.navError + 1);
                        printLog('The ancient writings confuse your mind and navigation.', 'alert');
                    } else {
                        G.navError = Math.max(0.5, G.navError * 0.85);
                        G.mat.canvas += 3;
                        G.morale = clamp(G.morale + 6, 0, 100);
                        printLog('The hieroglyphs reveal navigation secrets and provide canvas materials.', 'normal');
                    }
                }
            }
        ]
    },

    crystal_caverns: {
        description: 'Towering crystal formations surround you, refracting light into rainbow patterns. The crystals hum with an otherworldly energy that makes your skin tingle.',
        choices: [
            {
                text: 'Mine the crystals (Risk: Energy Discharge)',
                risk: () => {
                    const discharge = rr() < 0.35;
                    if (discharge) {
                        G.hp = clamp(G.hp - 10, 0, 100);
                        G.san = clamp(G.san - 12, 0, 100);
                        printLog('Crystal energy arcs through you, burning body and mind!', 'alert');
                    } else {
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('crystal_shard');
                        G.mat.metal += 2;
                        G.mat.canvas += 2;
                        G.san = clamp(G.san + 8, 0, 100);
                        printLog('The crystals yield artifacts, materials, and clarity of mind.', 'normal');
                    }
                }
            },
            {
                text: 'Meditate among the crystals (Risk: Overwhelming Visions)',
                risk: () => {
                    const visions = rr() < 0.3;
                    if (visions) {
                        G.san = clamp(G.san - 20, 0, 100);
                        G.hp = clamp(G.hp - 5, 0, 100);
                        printLog('Visions of impossible realities shatter your sanity!', 'alert');
                    } else {
                        G.san = clamp(G.san + 15, 0, 100);
                        G.morale = clamp(G.morale + 10, 0, 100);
                        G.navError = Math.max(0.5, G.navError * 0.9);
                        printLog('The crystals grant profound insight, healing your mind and improving navigation.', 'normal');
                    }
                }
            }
        ]
    },

    generic_cave: {
        description: 'You enter a dark cave. Water drips from the ceiling, and the echoes of your footsteps bounce off the walls.',
        choices: [
            {
                text: 'Look around',
                risk: () => {
                    printLog('The cave is empty save for echoes. You find nothing of value.', 'normal');
                }
            }
        ]
    },

    shipwreck_graveyard: {
        description: 'Sunken ships litter the ocean floor, their masts reaching like skeletal fingers toward the surface. Barnacles and coral encrust the hulls, and schools of fish dart between the wrecks.',
        choices: [
            {
                text: 'Salvage a nearby wreck (Risk: Structural Collapse)',
                risk: () => {
                    const collapse = rr() < 0.4;
                    if (collapse) {
                        G.hp = clamp(G.hp - 12, 0, 100);
                        G.san = clamp(G.san - 6, 0, 100);
                        printLog('The wreck shifts as you work, pinning you beneath debris!', 'alert');
                    } else {
                        G.mat.metal += 8;
                        G.mat.canvas += 3;
                        G.mat.rope += 4;
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('nautical_chronometer');
                        printLog('You recover valuable metals, canvas sails, and an ancient timepiece artifact.', 'normal');
                    }
                }
            },
            {
                text: 'Search for the captain\'s quarters (Risk: Drowning)',
                risk: () => {
                    const drown = rr() < 0.35;
                    if (drown) {
                        G.hp = clamp(G.hp - 18, 0, 100);
                        G.san = clamp(G.san - 8, 0, 100);
                        printLog('Water floods the compartment before you can escape!', 'alert');
                    } else {
                        G.mat.metal += 4;
                        G.waterStocks.rain += 3;
                        G.navError = Math.max(0.5, G.navError * 0.9);
                        printLog('You find preserved charts and rainwater barrels that improve navigation.', 'normal');
                    }
                }
            }
        ]
    },

    pirate_hideout: {
        description: 'A hidden cove shelters a pirate encampment, with makeshift huts built into the cliffs and a black flag fluttering in the breeze. The air smells of rum, gunpowder, and adventure.',
        choices: [
            {
                text: 'Raid the supply cache (Risk: Ambush)',
                risk: () => {
                    const ambush = rr() < 0.45;
                    if (ambush) {
                        G.hp = clamp(G.hp - 14, 0, 100);
                        G.foodStocks.salt += 2; // partial success
                        printLog('Pirates spring from hiding, cutting you down before you can escape!', 'alert');
                    } else {
                        G.foodStocks.salt += 6;
                        G.mat.metal += 5;
                        G.mat.canvas += 3;
                        G.morale = clamp(G.morale + 8, 0, 100);
                        printLog('The cache yields preserved rations, weapons, and canvas. The pirate life calls!', 'normal');
                    }
                }
            },
            {
                text: 'Steal a map from the captain\'s tent (Risk: Guard Alert)',
                risk: () => {
                    const alert = rr() < 0.3;
                    if (alert) {
                        G.hp = clamp(G.hp - 8, 0, 100);
                        G.morale = clamp(G.morale - 5, 0, 100);
                        printLog('Guards spot you and give chase, forcing a hasty retreat!', 'alert');
                    } else {
                        G.navError = Math.max(0.5, G.navError * 0.8);
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('pirate_treasure_map');
                        G.morale = clamp(G.morale + 6, 0, 100);
                        printLog('The map reveals hidden islands and bolsters your adventurous spirit!', 'normal');
                    }
                }
            }
        ]
    },

    volcano_summit: {
        description: 'You climb to the smoking summit of an active volcano. Lava bubbles in the crater below, and the ground is hot beneath your feet. Strange crystals glint in the volcanic glass.',
        choices: [
            {
                text: 'Mine the volcanic crystals (Risk: Eruption)',
                risk: () => {
                    const eruption = rr() < 0.4;
                    if (eruption) {
                        G.hp = clamp(G.hp - 16, 0, 100);
                        G.san = clamp(G.san - 10, 0, 100);
                        printLog('The volcano erupts violently, forcing you to flee through ash and fire!', 'alert');
                    } else {
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('volcanic_crystal');
                        G.mat.metal += 6;
                        G.mat.rope += 3;
                        G.san = clamp(G.san + 5, 0, 100);
                        printLog('The crystals pulse with power, yielding artifacts and hardening your resolve.', 'normal');
                    }
                }
            },
            {
                text: 'Observe the lava flows (Risk: Ground Collapse)',
                risk: () => {
                    const collapse = rr() < 0.25;
                    if (collapse) {
                        G.hp = clamp(G.hp - 10, 0, 100);
                        G.mat.metal += 2;
                        printLog('The ground gives way, dropping you toward the lava before you scramble free!', 'alert');
                    } else {
                        G.navError = Math.max(0.5, G.navError * 0.9);
                        G.mat.canvas += 4;
                        G.hp = clamp(G.hp + 3, 0, 100);
                        printLog('Studying the flows teaches you about currents and yields heat-resistant canvas.', 'normal');
                    }
                }
            }
        ]
    },

    ice_cave: {
        description: 'A frozen cavern glimmers with ice formations that refract light into rainbows. Your breath freezes in the air, and the distant sound of cracking ice echoes through the chamber.',
        choices: [
            {
                text: 'Mine the ice formations (Risk: Cave-in)',
                risk: () => {
                    const caveIn = rr() < 0.35;
                    if (caveIn) {
                        G.hp = clamp(G.hp - 12, 0, 100);
                        G.san = clamp(G.san - 7, 0, 100);
                        printLog('The ice cracks and collapses, burying you in freezing debris!', 'alert');
                    } else {
                        G.waterStocks.fresh += 6;
                        G.mat.canvas += 3;
                        G.san = clamp(G.san + 4, 0, 100);
                        printLog('The pure ice yields fresh water and flexible canvas materials.', 'normal');
                    }
                }
            },
            {
                text: 'Explore the frozen depths (Risk: Hypothermia)',
                risk: () => {
                    const hypothermia = rr() < 0.4;
                    if (hypothermia) {
                        G.hp = clamp(G.hp - 15, 0, 100);
                        G.morale = clamp(G.morale - 8, 0, 100);
                        printLog('The cold seeps into your bones, weakening you dangerously!', 'alert');
                    } else {
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('frozen_relic');
                        G.mat.metal += 3;
                        G.navError = Math.max(0.5, G.navError * 0.95);
                        printLog('Ancient frozen artifacts teach you about navigation in extreme conditions.', 'normal');
                    }
                }
            }
        ]
    },

    ghost_ship: {
        description: 'A spectral ship drifts through the mist, its tattered sails fluttering despite no wind. Phantom crew members go about their duties, and the air is thick with otherworldly chill.',
        choices: [
            {
                text: 'Board and search the hold (Risk: Haunting)',
                risk: () => {
                    const haunting = rr() < 0.5;
                    if (haunting) {
                        G.san = clamp(G.san - 25, 0, 100);
                        G.hp = clamp(G.hp - 8, 0, 100);
                        printLog('Ghostly apparitions assault your mind and body!', 'alert');
                    } else {
                        G.mat.metal += 4;
                        G.mat.canvas += 5;
                        G.mat.rope += 3;
                        G.morale = clamp(G.morale + 4, 0, 100);
                        printLog('You recover materials from the spectral ship, proving your bravery.', 'normal');
                    }
                }
            },
            {
                text: 'Consult the ship\'s log (Risk: Possession)',
                risk: () => {
                    const possession = rr() < 0.3;
                    if (possession) {
                        G.san = clamp(G.san - 20, 0, 100);
                        G.morale = clamp(G.morale - 12, 0, 100);
                        printLog('Reading the cursed log invites a spirit that haunts your thoughts!', 'alert');
                    } else {
                        G.navError = Math.max(0.5, G.navError * 0.85);
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('cursed_compass');
                        G.san = clamp(G.san + 3, 0, 100);
                        printLog('The log reveals navigational secrets and yields a powerful artifact.', 'normal');
                    }
                }
            }
        ]
    },

    treasure_vault: {
        description: 'A vault door stands ajar, revealing piles of gold and jewels within. Pressure plates and tripwires crisscross the floor, and poison darts glint in the torchlight.',
        choices: [
            {
                text: 'Disarm the traps and take the gold (Risk: Trigger)',
                risk: () => {
                    const trigger = rr() < 0.4;
                    if (trigger) {
                        G.hp = clamp(G.hp - 18, 0, 100);
                        G.mat.metal += 3; // partial success
                        printLog('Traps activate, poisoning you before you can claim much!', 'alert');
                    } else {
                        G.mat.metal += 10;
                        G.mat.canvas += 2;
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('jeweled_crown');
                        printLog('Masterfully disarmed, you claim the treasure and a magnificent crown!', 'normal');
                    }
                }
            },
            {
                text: 'Search for hidden compartments (Risk: Hidden Trap)',
                risk: () => {
                    const hidden = rr() < 0.25;
                    if (hidden) {
                        G.hp = clamp(G.hp - 12, 0, 100);
                        G.san = clamp(G.san - 8, 0, 100);
                        printLog('A hidden trap catches you unaware, injuring body and mind!', 'alert');
                    } else {
                        G.mat.metal += 6;
                        G.mat.rope += 3;
                        G.navError = Math.max(0.5, G.navError * 0.9);
                        printLog('Secret compartments yield additional treasure and navigational tools.', 'normal');
                    }
                }
            }
        ]
    },

    ancient_library: {
        description: 'Dust motes dance in beams of light filtering through cracks in the stone ceiling. Towering shelves of ancient tomes surround you, their pages whispering secrets of forgotten knowledge.',
        choices: [
            {
                text: 'Read forbidden texts (Risk: Knowledge Overload)',
                risk: () => {
                    const overload = rr() < 0.35;
                    if (overload) {
                        G.san = clamp(G.san - 20, 0, 100);
                        G.hp = clamp(G.hp - 5, 0, 100);
                        printLog('The forbidden knowledge overwhelms your mind!', 'alert');
                    } else {
                        G.san = clamp(G.san + 12, 0, 100);
                        G.navError = Math.max(0.5, G.navError * 0.85);
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('ancient_tome');
                        printLog('The texts grant profound wisdom and navigational mastery.', 'normal');
                    }
                }
            },
            {
                text: 'Search for practical knowledge (Risk: Time Waste)',
                risk: () => {
                    const waste = rr() < 0.2;
                    if (waste) {
                        G.morale = clamp(G.morale - 6, 0, 100);
                        printLog('Hours slip away in fruitless study, dampening your spirits.', 'alert');
                    } else {
                        G.mat.canvas += 4;
                        G.mat.rope += 2;
                        G.hp = clamp(G.hp + 4, 0, 100);
                        printLog('You discover practical knowledge and materials for ship repair.', 'normal');
                    }
                }
            }
        ]
    },

    monster_lair: {
        description: 'Bones litter the ground and the air carries the stench of a predator\'s lair. Something large and dangerous has made this place its home. Growls echo from the darkness.',
        choices: [
            {
                text: 'Fight the creature (Risk: Combat)',
                risk: () => {
                    const defeat = rr() < 0.5;
                    if (defeat) {
                        G.hp = clamp(G.hp - 20, 0, 100);
                        G.san = clamp(G.san - 10, 0, 100);
                        printLog('The beast overpowers you, leaving you battered and terrified!', 'alert');
                    } else {
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('monster_hide');
                        G.mat.canvas += 6;
                        G.morale = clamp(G.morale + 10, 0, 100);
                        printLog('Victory! The creature\'s hide becomes canvas and proves your courage.', 'normal');
                    }
                }
            },
            {
                text: 'Steal from the hoard (Risk: Alert Creature)',
                risk: () => {
                    const alert = rr() < 0.3;
                    if (alert) {
                        G.hp = clamp(G.hp - 15, 0, 100);
                        G.mat.metal += 2;
                        printLog('The creature awakens and attacks before you can escape with much!', 'alert');
                    } else {
                        G.mat.metal += 7;
                        G.mat.rope += 4;
                        G.san = clamp(G.san + 3, 0, 100);
                        printLog('You slip in and out with treasure, your stealth impressing even yourself.', 'normal');
                    }
                }
            }
        ]
    },

    alchemist_lab: {
        description: 'Bubbling potions and strange apparatuses fill this hidden laboratory. Colored liquids swirl in glass vials, and the air hums with magical energy. An alchemist\'s notes are scattered across workbenches.',
        choices: [
            {
                text: 'Experiment with potions (Risk: Explosion)',
                risk: () => {
                    const explosion = rr() < 0.4;
                    if (explosion) {
                        G.hp = clamp(G.hp - 14, 0, 100);
                        G.san = clamp(G.san - 8, 0, 100);
                        printLog('A potion explodes violently, injuring you and warping reality!', 'alert');
                    } else {
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('alchemical_elixir');
                        G.hp = clamp(G.hp + 8, 0, 100);
                        G.san = clamp(G.san + 6, 0, 100);
                        printLog('You create a restorative elixir that heals body and mind.', 'normal');
                    }
                }
            },
            {
                text: 'Study the alchemical notes (Risk: Confusion)',
                risk: () => {
                    const confusion = rr() < 0.25;
                    if (confusion) {
                        G.san = clamp(G.san - 12, 0, 100);
                        G.navError = Math.min(15, G.navError + 2);
                        printLog('The complex formulas confuse and disorient you.', 'alert');
                    } else {
                        G.navError = Math.max(0.5, G.navError * 0.9);
                        G.mat.metal += 3;
                        G.mat.canvas += 2;
                        printLog('The notes teach you about materials and improve your navigation.', 'normal');
                    }
                }
            }
        ]
    },

    smuggler_den: {
        description: 'Hidden compartments and false walls conceal this underground smugglers\' hideout. Crates of illicit goods are stacked everywhere, and the air smells of exotic spices and contraband.',
        choices: [
            {
                text: 'Raid the contraband crates (Risk: Traps)',
                risk: () => {
                    const traps = rr() < 0.35;
                    if (traps) {
                        G.hp = clamp(G.hp - 10, 0, 100);
                        G.mat.metal += 2;
                        printLog('Poisoned needles and spring traps catch you unaware!', 'alert');
                    } else {
                        G.mat.metal += 6;
                        G.mat.canvas += 4;
                        G.foodStocks.citrus += 4;
                        G.morale = clamp(G.morale + 5, 0, 100);
                        printLog('You claim exotic goods, rare metals, and feel like a true outlaw.', 'normal');
                    }
                }
            },
            {
                text: 'Search for hidden documents (Risk: Discovery)',
                risk: () => {
                    const discovery = rr() < 0.2;
                    if (discovery) {
                        G.morale = clamp(G.morale - 8, 0, 100);
                        printLog('You trigger an alarm, alerting smugglers who chase you away!', 'alert');
                    } else {
                        G.navError = Math.max(0.5, G.navError * 0.9);
                        if (!G.artifacts) G.artifacts = [];
                        G.artifacts.push('smuggler_network_map');
                        G.mat.rope += 3;
                        printLog('Secret documents reveal trade routes and smuggling networks.', 'normal');
                    }
                }
            }
        ]
    }
};

const dungeonScenes = {
    'island_dungeon': {
        enter: () => {
            const isl = G.curIsland;
            const dungeonTypes = {
                tropical: 'jungle_temple',
                barren: 'mountain_cave',
                volcanic: 'lava_chamber',
                mystical: 'ancient_ruins',
                coastal: 'underwater_cavern',
                desert: 'desert_tomb',
                crystal: 'crystal_caverns'
            };
            // Use currentDungeon if set (e.g., from console command), otherwise determine from island
            G.currentDungeon = G.currentDungeon || (isl ? dungeonTypes[isl.type] : null) || 'generic_cave';
        },
        text: () => {
            const dungeonType = G.currentDungeon;
            const dungeonConfig = DUNGEON_TYPES[dungeonType];
            return dungeonConfig ? dungeonConfig.description : DUNGEON_TYPES.generic_cave.description;
        },
        choices: () => {
            const dungeonType = G.currentDungeon;
            const dungeonConfig = DUNGEON_TYPES[dungeonType];
            let c = [];

            if (dungeonConfig && dungeonConfig.choices) {
                dungeonConfig.choices.forEach(choice => {
                    c.push({
                        text: choice.text,
                        cb: async () => {
                            choice.risk(); // Execute the risk/reward logic
                            setScene('island_approach');
                        }
                    });
                });
            } else {
                // Fallback for generic_cave
                c.push({
                    text: 'Look around',
                    cb: async () => {
                        DUNGEON_TYPES.generic_cave.choices[0].risk();
                        setScene('island_approach');
                    }
                });
            }

            c.push({ text: 'Retreat to the coast', cb: () => setScene('island_approach') });
            return c;
        }
    }
};

window.dungeonScenes = dungeonScenes;
window.DUNGEON_TYPES = DUNGEON_TYPES;
