#pragma once

#include <iostream>
#include <chrono>
#include <unistd.h>
#include <math.h>
#include <thread>
#include <string.h>

#define LEDS 192
#define HIGH 4095
#define LOW 0

void sleepms(int duration);

class PatternThread
{
public:
	PatternThread();
	~PatternThread();

	void start();
	void close() { ask_to_stop = true; };
	void join();
	bool isRunning() const { return is_running; };
	bool *isUpdated() { return &is_updated; };

	uint16_t *getPatternColors() const { return colors; }

	void setDefaultPattern(std::string default_pattern);

private:
	uint16_t *colors;
	std::thread *thread;
	int loop;
	uint16_t biton;
	bool reverse;
	bool is_running = false;
	bool ask_to_stop = false; // demande d'arret
	bool is_updated;
	std::string default_pattern;

	void process();

	void set_color(uint16_t x, uint16_t y, uint16_t r, uint16_t g, uint16_t b);
	void fill_color_off();

	void pattern_iplusplus();			// Chromosomes, 2 lignes rouge, puis vert, bleu...
	void pattern_test_set_led_color();	// R, G, B puis blanc, à la suite
	void pattern_guirlande();			// Random (avec 10 % d'allumé)
	void pattern_carre_plein();			// Carré au milieu qui grossis
	void pattern_carre_bord();			// Carré au milieu qui s'étend
	void pattern_set_led_value();		// Control manuel
	void pattern_ligne_balai();			// Une ligne va de la gauche vers la droite et inversement
	void pattern_ligne_balai_alterne(); // Une ligne va de la gauche vers la droite et inversement (en alterné)
};